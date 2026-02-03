"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { CreateTransactionInput, CreateTransactionSchema } from "../_types/investment-schema";
import { revalidatePath } from "next/cache";

export const createTransaction = async (input: CreateTransactionInput) => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    if (!userId) {
        // For now, if no user, we might allow it for local dev or throw
        // throw new Error("Unauthorized");
    }

    const { type, assetCode, assetName, quantity, price, fee, date, notes } = input;
    const totalAmount = quantity * price + fee;

    // 1. Find or Create Asset
    let asset = await db.asset.findUnique({
        where: { code: assetCode },
    });

    if (!asset) {
        if (!assetName) {
            throw new Error(`Asset ${assetCode} not found and no name provided to create it.`);
        }
        asset = await db.asset.create({
            data: {
                code: assetCode,
                name: assetName,
                type: "STOCK", // Default, maybe allow user to select?
                userId,
            }
        });
    }

    // 2. Create Transaction Record
    const transaction = await db.transaction.create({
        data: {
            type,
            quantity,
            price,
            fee,
            totalAmount,
            date,
            notes,
            assetId: asset.id,
        }
    });

    // 3. Update Asset Position (Avg Cost, Quantity)
    // Simple Weighted Average Cost logic
    if (type === "BUY") {
        const totalCostNew = (asset.avgCost * asset.quantity) + (price * quantity) + fee;
        const totalQtyNew = asset.quantity + quantity;
        const newAvgCost = totalQtyNew > 0 ? totalCostNew / totalQtyNew : 0;

        await db.asset.update({
            where: { id: asset.id },
            data: {
                quantity: totalQtyNew,
                avgCost: newAvgCost,
                // Update current price to last buy price? Or keep separate?
                // currentPrice: price, 
            }
        });
    } else if (type === "SELL") {
        // Selling doesn't change Avg Cost (FIFO/Weighted avg rule), just reduces quantity
        // Realized Profit = (Price - AvgCost) * Qty - Fee

        await db.asset.update({
            where: { id: asset.id },
            data: {
                quantity: asset.quantity - quantity,
            }
        });
    }

    // 4. Revalidate cache
    revalidatePath("/overView");

    return { success: true, transactionId: transaction.id };
};

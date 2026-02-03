"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { CreateTransactionInput, CreateTransactionSchema } from "../_types/investment-schema";
import { revalidatePath } from "next/cache";

import { executeAction } from "@/lib/executeAction";

export const createTransaction = async (input: CreateTransactionInput) => {
    return executeAction({
        actionFn: async () => {
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
                    }
                });
            } else if (type === "SELL") {
                await db.asset.update({
                    where: { id: asset.id },
                    data: {
                        quantity: asset.quantity - quantity,
                    }
                });
            }

            // 4. Revalidate cache
            revalidatePath("/overView");

            // return { success: true, transactionId: transaction.id }; // executeAction usually returns void or result of actionFn? 
            // Looking at executeAction definition: const executeAction = async <T>({ actionFn }: Options<T>) => { try { await actionFn(); } ... }
            // It seems to return whatever executeAction returns, which is Promise<void> (implicit) or implicit return of catch block?
            // Actually executeAction source: 
            // const executeAction = async <T>({ actionFn }: Options<T>) => { try { await actionFn(); } catch... }
            // It doesn't return the result of actionFn?
            // Wait, looking at executeAction.ts:
            // const executeAction = async <T>({ actionFn }: Options<T>) => { try { await actionFn(); } ... }
            // It AWAITS actionFn but DOES NOT RETURN its result. It returns Promise<void> implicitly.
            // So my previous return value { success: true } is lost?
            // meal-mutations.ts also doesn't return anything.
            // So I should not return anything either.
        }
    });
};

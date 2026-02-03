"use server";

import db from "@/lib/db"; // Assuming this is where the prisma client instance is
import { auth } from "@/lib/auth";
import { AssetModel, AssetSchema } from "../_types/investment-schema";
import { Prisma } from "@prisma/client";

export const getAssets = async (): Promise<AssetModel[]> => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    // Ideally filter by userId if implemented
    const where: Prisma.AssetWhereInput = userId ? { userId } : {};

    const assets = await db.asset.findMany({
        where,
        orderBy: { quantity: 'desc' } // e.g. sort by holding size? Or just created?
    });

    // Calculate generic fields that might be persistent or dynamic
    return assets.map(asset => {
        const totalValue = asset.quantity * asset.currentPrice;
        const totalCost = asset.quantity * asset.avgCost;
        const totalProfit = totalValue - totalCost;

        return {
            ...asset,
            // Map Prisma enums to Zod enums if strictly typed, usually compatible
            type: asset.type as any,
            totalValue,
            totalCost,
            totalProfit,
            dailyChange: 0, // Placeholder: need real market data source for this
        };
    });
};

export const getPortfolioSummary = async () => {
    const assets = await getAssets();

    let totalNetWorth = 0;
    let totalProfit = 0;

    assets.forEach(a => {
        totalNetWorth += (a.totalValue || 0);
        totalProfit += (a.totalProfit || 0);
    });

    return {
        totalNetWorth,
        totalProfit,
        dailyProfit: 0 // Placeholder
    };
}

"use server";

import db from "@/lib/db"; // Assuming this is where the prisma client instance is
import { auth } from "@/lib/auth";
import { AssetModel, AssetSchema } from "../_types/investment-schema";
import { Prisma } from "@prisma/client";



export const getAssets = async (): Promise<AssetModel[]> => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    // If no user, return empty or Admin's data for demo? 
    // For now let's show all assets if userId is not present (or restrict to admin if we want strict auth)
    // But since we just seeded Admin, we need to match that.

    const where: Prisma.AssetWhereInput = userId ? { userId } : {};

    const assets = await db.asset.findMany({
        where,
        orderBy: { quantity: 'desc' }
    });

    return assets.map(asset => {
        const totalValue = asset.quantity * asset.currentPrice;
        const totalCost = asset.quantity * asset.avgCost;
        const totalProfit = totalValue - totalCost;

        return {
            ...asset,
            type: asset.type as any,
            totalValue,
            totalCost,
            totalProfit,
            dailyChange: 0,
        };
    });
};

export const getPortfolioSummary = async () => {
    const assets = await getAssets();

    let totalNetWorth = 0;
    let totalProfit = 0;
    let totalCost = 0;

    assets.forEach(a => {
        totalNetWorth += (a.totalValue || 0);
        totalCost += (a.totalCost || 0);
        totalProfit += (a.totalProfit || 0);
    });

    // Simple Calculate Cash Ratio (Assuming 'OTHER' could be cash or just 0 for now)
    // If we had a CASH type we would use it. For now detailed cash logic is skipped.
    const cashRatio = 0;

    return {
        totalNetWorth,
        totalProfit,
        totalCost,
        dailyProfit: 0,
        cashRatioString: "0%", // Placeholder
    };
}

export const getAssetAllocation = async () => {
    const assets = await getAssets();
    const allocationMap = new Map<string, number>();

    assets.forEach(a => {
        const type = a.type;
        const val = a.totalValue || 0;
        allocationMap.set(type, (allocationMap.get(type) || 0) + val);
    });

    const data = Array.from(allocationMap.entries()).map(([name, value]) => ({
        name,
        value
    }));

    return data;
}

export const getPortfolioSnapshots = async () => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    if (!userId) return [];

    const snapshots = await db.portfolioSnapshot.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 30 // Last 30 days for chart
    });

    return snapshots.map(s => ({
        date: s.date.toISOString().split('T')[0],
        value: s.totalNetWorth,
        cost: s.totalCost,
        profit: s.totalProfit
    }));
};

export const tryCreateDailySnapshot = async () => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    if (!userId) return;

    // Check if snapshot exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.portfolioSnapshot.findFirst({
        where: {
            userId,
            date: today
        }
    });

    if (existing) return; // Already snapped

    // Calculate current stats
    const summary = await getPortfolioSummary();

    await db.portfolioSnapshot.create({
        data: {
            userId,
            date: today,
            totalNetWorth: summary.totalNetWorth,
            totalCost: summary.totalCost,
            totalProfit: summary.totalProfit
        }
    });
};

"use server";

import db from "@/lib/db"; // Assuming this is where the prisma client instance is
import { auth } from "@/lib/auth";
import { AssetModel, AssetSchema } from "../_types/investment-schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";



export const getAssets = async (): Promise<AssetModel[]> => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    // If no user, return empty or Admin's data for demo? 
    // For now let's show all assets if userId is not present (or restrict to admin if we want strict auth)
    // But since we just seeded Admin, we need to match that.

    const where: Prisma.AssetWhereInput = userId ? { userId } : {};

    const assets = await db.asset.findMany({
        where,
        include: {
            assetClass: true
        },
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
            assetClassName: asset.assetClass?.name,
            assetClassColor: asset.assetClass?.color
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

    // Calculate current stats
    const summary = await getPortfolioSummary();

    // Upsert snapshot for today to ensure it reflects latest state
    await db.portfolioSnapshot.upsert({
        where: {
            userId_date: {
                userId,
                date: today
            }
        },
        create: {
            userId,
            date: today,
            totalNetWorth: summary.totalNetWorth,
            totalCost: summary.totalCost,
            totalProfit: summary.totalProfit
        },
        update: {
            totalNetWorth: summary.totalNetWorth,
            totalCost: summary.totalCost,
            totalProfit: summary.totalProfit
        }
    });

    // Revalidate needed? Maybe not strictly if Client Component fetches.
    // But good practice if server components use it.
    revalidatePath("/overView");
};


// deleteAsset moved to market-actions.ts

export const getAllocationGap = async () => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    // Match logic in market-actions: allow null userId
    const where = userId ? { userId } : { userId: null };
    // Note: getAssets uses {} for no user, which returns all. 
    // Here we are stricter to match AssetClass behavior. 
    // If getAssets is returning all, we might need to adjust, but let's try strict first.

    const [classes, assets] = await Promise.all([
        db.assetClass.findMany({ where: where }),
        db.asset.findMany({ where: where })
    ]);

    const totalValue = assets.reduce((sum, a) => sum + (a.currentPrice * a.quantity), 0);
    if (totalValue === 0) return [];

    const result = classes.map(c => {
        const classAssets = assets.filter(a => a.assetClassId === c.id);
        const classValue = classAssets.reduce((sum, a) => sum + (a.currentPrice * a.quantity), 0);
        const actualPercent = (classValue / totalValue) * 100;

        return {
            name: c.name,
            actual: Number(actualPercent.toFixed(1)),
            target: c.targetPercent,
            color: c.color
        };
    });

    // Check for Unclassified
    const unclassifiedAssets = assets.filter(a => !a.assetClassId);
    if (unclassifiedAssets.length > 0) {
        const unclassValue = unclassifiedAssets.reduce((sum, a) => sum + (a.currentPrice * a.quantity), 0);
        const unclassPercent = (unclassValue / totalValue) * 100;
        result.push({
            name: "Unclassified",
            actual: Number(unclassPercent.toFixed(1)),
            target: 0,
            color: "#94a3b8" // Slate 400
        });
    }

    return result;
};
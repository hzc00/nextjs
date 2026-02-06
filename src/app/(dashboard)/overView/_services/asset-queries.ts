"use server";

import db from "@/lib/db"; // Assuming this is where the prisma client instance is
import { auth } from "@/lib/auth";
import { AssetModel } from "../_types/asset.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getExchangeRates } from "./market-actions";



export const getAssets = async (userIdOverride?: number): Promise<AssetModel[]> => {
    let userId = userIdOverride;
    if (!userId) {
        const session = await auth();
        userId = session?.user?.id ? Number(session.user.id) : undefined;
    }

    // If no user, return empty or Admin's data for demo? 
    // For now, if no userId is found/provided, we return empty to be safe (or strict auth)
    // to avoid leaking data if something goes wrong.
    if (!userId) {
        // Fallback: If strict mode off, maybe return all? But we have multi-tenant now.
        // Let's return empty if no user identified.
        return [];
    }

    const where: Prisma.AssetWhereInput = { userId };

    const assets = await db.asset.findMany({
        where,
        include: {
            assetClass: true
        },
        orderBy: { quantity: 'desc' }
    });

    const rates = await getExchangeRates();

    return assets.map(asset => {
        const totalValue = asset.quantity * asset.currentPrice;
        const totalCost = asset.quantity * asset.avgCost;
        const totalProfit = totalValue - totalCost;

        const currency = asset.currency || "CNY";
        const rate = rates[currency as keyof typeof rates] || 1;
        const valueInCNY = totalValue * rate;

        return {
            ...asset,
            type: asset.type as AssetModel['type'],
            totalValue,
            totalCost,
            totalProfit,
            dailyChange: asset.dailyChange || 0,
            currency,
            valueInCNY,
            assetClassName: asset.assetClass?.name,
            assetClassColor: asset.assetClass?.color
        };
    });
};

export const getPortfolioSummary = async (userIdOverride?: number) => {
    const assets = await getAssets(userIdOverride);

    const rates = await getExchangeRates();

    let totalNetWorth = 0;
    let totalProfit = 0;
    let totalCost = 0;

    assets.forEach(a => {
        const currency = a.currency || "CNY";
        const rate = rates[currency as keyof typeof rates] || 1;

        totalNetWorth += (a.totalValue || 0) * rate;
        totalCost += (a.totalCost || 0) * rate;
        totalProfit += (a.totalProfit || 0) * rate;
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

// Internal helper for single user snapshot
const createSnapshotForUser = async (userId: number) => {
    // Check if snapshot exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current stats
    const summary = await getPortfolioSummary(userId);

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
}

export const tryCreateDailySnapshot = async () => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    if (!userId) return;

    await createSnapshotForUser(userId);

    // Revalidate needed? Maybe not strictly if Client Component fetches.
    // But good practice if server components use it.
    revalidatePath("/overView");
};

// --- CRON JOB SUPPORT ---
export const createScanningSnapshots = async () => {
    // 1. Get all distinct users who have assets (optimization) or just all users
    // For simplicity, let's get all Users. 
    const users = await db.user.findMany({ select: { id: true } });

    console.log(`[Cron] Starting snapshot for ${users.length} users...`);

    for (const user of users) {
        try {
            await createSnapshotForUser(user.id);
        } catch (e) {
            console.error(`[Cron] Failed to create snapshot for user ${user.id}`, e);
        }
    }
    console.log(`[Cron] Finished snapshots.`);
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
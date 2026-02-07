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
    let dailyProfit = 0;

    assets.forEach(a => {
        const currency = a.currency || "CNY";
        const rate = rates[currency as keyof typeof rates] || 1;

        const assetValueCNY = (a.totalValue || 0) * rate;
        totalNetWorth += assetValueCNY;
        totalCost += (a.totalCost || 0) * rate;
        totalProfit += (a.totalProfit || 0) * rate;

        // Calculate daily profit contribution in CNY
        // DailyProfit = MV_now - MV_yesterday
        // MV_now = User's current Market Value (assetValueCNY)
        // MV_yesterday = MV_now / (1 + Pct/100)
        // DailyProfit = MV_now * (Pct/100) / (1 + Pct/100)
        const pct = a.dailyChange || 0;
        const assetDailyProfit = (assetValueCNY * pct / 100) / (1 + pct / 100);
        dailyProfit += assetDailyProfit;
    });

    const dailyChangePercent = totalNetWorth - dailyProfit !== 0
        ? (dailyProfit / (totalNetWorth - dailyProfit)) * 100
        : 0;

    return {
        totalNetWorth,
        totalProfit,
        totalCost,
        dailyProfit,
        dailyChangePercent,
        cashRatioString: "0%", // Placeholder
    };
}

export const getAssetAllocation = async () => {
    const assets = await getAssets();
    const allocationMap = new Map<string, { value: number, color?: string }>();

    assets.forEach(a => {
        const name = a.assetClassName || "Unclassified";
        const val = a.valueInCNY || 0; // Use RMB value
        const color = a.assetClassColor || undefined;
        
        const existing = allocationMap.get(name) || { value: 0, color };
        allocationMap.set(name, { value: existing.value + val, color: existing.color || color });
    });

    const data = Array.from(allocationMap.entries()).map(([name, item]) => ({
        name,
        value: item.value,
        color: item.color
    }));

    return data;
}

export const getPortfolioSnapshots = async (days: number = 30) => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    if (!userId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await db.portfolioSnapshot.findMany({
        where: {
            userId,
            date: { gte: startDate }
        },
        orderBy: { date: 'asc' },
    });

    return snapshots.map(s => ({
        date: s.date.toISOString().split('T')[0],
        value: s.totalNetWorth,
        cost: s.totalCost,
        profit: s.totalProfit
    }));
};

// Internal helper for single user snapshot
const createSnapshotForUser = async (userId: number, forceUpdate: boolean = false) => {
    // Check if snapshot exists for today (Beijing Time)
    // We normalize "Today" to Asia/Shanghai Midnight to ensure consistency across environments (Local Dev vs Vercel UTC)
    const now = new Date();
    const shanghaiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // Returns YYYY-MM-DD
    const today = new Date(`${shanghaiDateStr}T00:00:00+08:00`); // Force Shanghai Midnight

    // If not forcing update (Client side check), checks if exists
    if (!forceUpdate) {
        const existing = await db.portfolioSnapshot.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today
                }
            }
        });
        if (existing) {
            // Snapshot already exists for today, do not overwrite with live data
            return;
        }
    }

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

    // Client side trigger: forceUpdate = false
    await createSnapshotForUser(userId, false);

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
            // Cron trigger: forceUpdate = true
            await createSnapshotForUser(user.id, true);
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

    // Use getAssets to get data with currency conversion
    const assets = await getAssets(userId || undefined);
    
    // Get asset classes
    const where = userId ? { userId } : { userId: null };
    const classes = await db.assetClass.findMany({ where });

    const totalValue = assets.reduce((sum, a) => sum + (a.valueInCNY || 0), 0);
    if (totalValue === 0) return [];

    const result = classes.map(c => {
        const classAssets = assets.filter(a => a.assetClassId === c.id);
        const classValue = classAssets.reduce((sum, a) => sum + (a.valueInCNY || 0), 0);
        const actualPercent = (classValue / totalValue) * 100;

        const targetValue = totalValue * (c.targetPercent / 100);
        const valDiff = targetValue - classValue;

        return {
            name: c.name,
            actual: Number(actualPercent.toFixed(1)),
            target: c.targetPercent,
            color: c.color,
            totalValue: classValue,
            targetValue: targetValue,
            valDiff: valDiff
        };
    });

    // Check for Unclassified
    const unclassifiedAssets = assets.filter(a => !a.assetClassId);
    if (unclassifiedAssets.length > 0) {
        const unclassValue = unclassifiedAssets.reduce((sum, a) => sum + (a.valueInCNY || 0), 0);
        const unclassPercent = (unclassValue / totalValue) * 100;
        // Target for unclassified is always 0, so diff is negative (remove all)
        const valDiff = 0 - unclassValue; 

        result.push({
            name: "Unclassified",
            actual: Number(unclassPercent.toFixed(1)),
            target: 0,
            color: "#94a3b8", // Slate 400
            totalValue: unclassValue,
            targetValue: 0,
            valDiff: valDiff
        });
    }

    return result;
};
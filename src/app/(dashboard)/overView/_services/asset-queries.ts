"use server";

import db from "@/lib/db"; // Assuming this is where the prisma client instance is
import { auth } from "@/lib/auth";
import { AssetModel } from "../_types/asset.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getExchangeRates } from "./market-actions";
import { TIME_ZONE, TIME_ZONE_OFFSET, CUTOFF_HOUR, CUTOFF_MINUTE } from "@/lib/constants";

/**
 * 返回上海时区当前时间上下文，使用 Intl API 避免 new Date(localeString) 双重转换问题。
 * @param now - 当前 UTC 时间
 */
function getShanghaiTimeContext(now: Date): { todayYMD: string; isPastCutoff: boolean } {
    const todayYMD = now.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    }).formatToParts(now);
    const shanghaiHour = parseInt(parts.find(p => p.type === 'hour')!.value);
    const shanghaiMinute = parseInt(parts.find(p => p.type === 'minute')!.value);
    const isPastCutoff = shanghaiHour > CUTOFF_HOUR ||
        (shanghaiHour === CUTOFF_HOUR && shanghaiMinute >= CUTOFF_MINUTE);
    return { todayYMD, isPastCutoff };
}


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

    // Old total value calculation
    assets.forEach(a => {
        const currency = a.currency || "CNY";
        const rate = rates[currency as keyof typeof rates] || 1;
        totalNetWorth += (a.totalValue || 0) * rate;
        totalCost += (a.totalCost || 0) * rate;
        totalProfit += (a.totalProfit || 0) * rate;
    });

    // --- Calculate Adjusted Cost Basis & XIRR ---
    let totalPrincipal = 0;
    let adjustedCostBasis = 0;
    let annualizedReturn = 0;

    // Resolve userId again properly if needed
    let targetUserId = userIdOverride;
    if (!targetUserId) {
        const session = await auth();
        targetUserId = session?.user?.id ? Number(session.user.id) : undefined;
    }

    // Default values if no principal found
    let adjustedProfit = totalProfit;
    let adjustedReturnRate = 0;

    if (targetUserId) {
        // Fetch all deposits/withdrawals ordered by date ASC
        const allFlows = await db.transaction.findMany({
            where: {
                userId: targetUserId,
                type: { in: ['DEPOSIT', 'WITHDRAW'] }
            },
            orderBy: { date: 'asc' }
        });

        // --- XIRR Reset Date Configuration ---
        // Provide a date here to ignore older transactions for XIRR calculation.
        // e.g., new Date('2024-03-01T00:00:00Z')
        const XIRR_START_DATE: Date | null = new Date(`2026-03-01T00:00:00${TIME_ZONE_OFFSET}`); // Set to March 1st (Beijing Time)

        const xirrCashflows: number[] = [];
        const xirrDates: Date[] = [];

        let depositSum = 0;
        let withdrawSum = 0;

        // Iteratively calculate Adjusted Cost Basis
        for (const f of allFlows) {
            if (f.type === 'DEPOSIT') {
                depositSum += f.totalAmount;
                adjustedCostBasis += f.totalAmount;

                // Only include in XIRR if it's after the start date (or no start date set)
                if (!XIRR_START_DATE || f.date >= XIRR_START_DATE) {
                    xirrCashflows.push(-f.totalAmount); // Outflow from user's pocket
                    xirrDates.push(f.date);
                }
            } else if (f.type === 'WITHDRAW') {
                withdrawSum += f.totalAmount;
                // Proportional reduction logic approximation (if we don't have live PV, we reduce cost basis by the absolute amount, floored at 0)
                adjustedCostBasis -= f.totalAmount;
                if (adjustedCostBasis < 0) adjustedCostBasis = 0;

                // Only include in XIRR if it's after the start date (or no start date set)
                if (!XIRR_START_DATE || f.date >= XIRR_START_DATE) {
                    xirrCashflows.push(f.totalAmount); // Inflow to user's pocket
                    xirrDates.push(f.date);
                }
            }
        }

        totalPrincipal = depositSum - withdrawSum;

        // If an XIRR Start Date is provided, we MUST inject the portfolio value at that time as the initial cost.
        // If an XIRR Start Date is provided, we MUST inject the portfolio value at that time as the initial cost.
        if (XIRR_START_DATE && XIRR_START_DATE <= new Date()) {
            // Find the closest snapshot on or before the start date
            const snapshot = await db.portfolioSnapshot.findFirst({
                where: {
                    userId: targetUserId,
                    date: { lte: XIRR_START_DATE }
                },
                orderBy: { date: 'desc' }
            });

            // If a snapshot exists, we use it as the initial starting point (negative cashflow)
            if (snapshot) {
                // Prepend to arrays
                xirrCashflows.unshift(-snapshot.totalNetWorth);
                xirrDates.unshift(XIRR_START_DATE);
            } else {
                // Fallback for new users or if no snapshot exists:
                // We don't have a starting value, so XIRR might be incomplete, but we continue with available flows.
                console.warn("XIRR_START_DATE is set, but no prior snapshot found for user.", targetUserId);
            }
        } else if (XIRR_START_DATE && XIRR_START_DATE > new Date()) {
            console.warn("XIRR_START_DATE is in the future. Ignoring start date snapshot injection.");
        }

        // Calculate XIRR if we have cashflows
        // We need at least one negative (investment) and one positive (current value) cashflow.
        // The start date snapshot acts as the initial negative investment.
        const hasInvestment = xirrCashflows.some(c => c < 0);

        if (XIRR_START_DATE && XIRR_START_DATE > new Date()) {
            // Start date is in the future, so we don't calculate XIRR yet. Show 0.
            annualizedReturn = 0;
            console.log("XIRR computation skipped: start date is in the future.");
        } else if (hasInvestment && totalNetWorth > 0) {
            // Add the final simulation: current total net worth as a positive cashflow today
            xirrCashflows.push(totalNetWorth);
            xirrDates.push(new Date());

            try {
                // We use dynamic import so it doesn't break if optionally installed
                const xirr = require('xirr');
                const rate = xirr.default ? xirr.default : xirr;

                // Helper to truncate date to midnight local time to match Excel XIRR behavior ("算头不算尾")
                const toStartOfDay = (d: Date) => {
                    const tzDate = new Date(d.toLocaleString("en-US", { timeZone: TIME_ZONE }));
                    tzDate.setHours(0, 0, 0, 0);
                    return tzDate;
                };

                // xirr library takes an array of objects { amount: number, when: Date }
                const inputs = xirrCashflows.map((amount, i) => ({
                    amount,
                    when: toStartOfDay(xirrDates[i])
                }));

                // Filter out zero cashflows that might cause issues, except the final one
                // Also consolidate cashflows that happen on the same exact day
                const consolidatedInputs = inputs.reduce((acc, curr) => {
                    const existing = acc.find(item => item.when.getTime() === curr.when.getTime());
                    if (existing) {
                        existing.amount += curr.amount;
                    } else {
                        acc.push({ ...curr });
                    }
                    return acc;
                }, [] as { amount: number, when: Date }[]);

                const validInputs = consolidatedInputs.filter((d, i) => d.amount !== 0 || i === consolidatedInputs.length - 1);

                if (validInputs.length >= 2) {
                    console.log("XIRR Inputs (Start of Day Adjusted):", JSON.stringify(validInputs, null, 2));
                    const result = rate(validInputs);
                    console.log("XIRR Result:", result);
                    // Convert to percentage (e.g. 0.15 -> 15%)
                    annualizedReturn = result * 100;
                } else {
                    annualizedReturn = 0;
                }
            } catch (err) {
                console.error("XIRR Calculation Failed:", err);
                annualizedReturn = 0; // Force 0 so UI doesn't crash, matching expected number type
            }
        } else {
            annualizedReturn = 0;
        }
    }

    // Simple Return calculation using adjustedCostBasis
    // If adjustedCostBasis is 0 (e.g. pulled out all initial money and now playing with house money),
    // simple return is technically infinite. We cap or show absolute profit.
    if (adjustedCostBasis > 0) {
        adjustedProfit = totalNetWorth - adjustedCostBasis;
        adjustedReturnRate = (totalNetWorth - adjustedCostBasis) / adjustedCostBasis;
    } else if (totalCost > 0) {
        // Fallback to pure asset cost if no transactions exist
        adjustedReturnRate = (totalNetWorth - totalCost) / totalCost;
    }

    // --- Daily Profit (Baseline Snapshot Architecture) --- 
    let dailyChangePercent = 0;
    let yesterdayProfit = 0; // Keeping old variable name for compatibility but it means "Previous Baseline Profit Change"

    if (targetUserId) {
        // 1. Determine the Baseline Time
        const now = new Date();
        const { todayYMD, isPastCutoff } = getShanghaiTimeContext(now);

        // 基准日期规则：未到截止时间 → 昨天（上一个21:25结算快照）；过了截止时间 → 今天（刚结算的快照）
        const baseDate = new Date(`${todayYMD}T12:00:00${TIME_ZONE_OFFSET}`);
        if (!isPastCutoff) baseDate.setDate(baseDate.getDate() - 1);
        const baselineShanghaiYMD = baseDate.toLocaleDateString('en-CA');
        const baselineStartOfDay = new Date(`${baselineShanghaiYMD}T00:00:00${TIME_ZONE_OFFSET}`);

        // 2. Fetch the Baseline Snapshot
        const baselineSnapshot = await db.portfolioSnapshot.findFirst({
            where: {
                userId: targetUserId,
                date: baselineStartOfDay
            }
        });

        if (baselineSnapshot) {
            // 3. Fetch Capital Flows (Deposits/Withdrawals) SINCE the Baseline Time
            // We use the exact cutoff timestamp of the baseline date
            const cutoffHH = String(CUTOFF_HOUR).padStart(2, '0');
            const cutoffMM = String(CUTOFF_MINUTE).padStart(2, '0');
            const baselineExactTime = new Date(`${baselineShanghaiYMD}T${cutoffHH}:${cutoffMM}:00${TIME_ZONE_OFFSET}`);

            const recentFlows = await db.transaction.groupBy({
                by: ['type'],
                where: {
                    userId: targetUserId,
                    date: { gt: baselineExactTime },
                    type: { in: ['DEPOSIT', 'WITHDRAW'] as any[] }
                },
                _sum: { totalAmount: true }
            });

            const recentDeposit = recentFlows.find(f => f.type === 'DEPOSIT')?._sum.totalAmount || 0;
            const recentWithdraw = recentFlows.find(f => f.type === 'WITHDRAW')?._sum.totalAmount || 0;
            const netCapitalFlowSinceBaseline = recentDeposit - recentWithdraw;

            // 4. Calculate Daily Profit accurately
            // Profit = (Current NW) - (Baseline NW) - (Capital Injected Since Baseline)
            dailyProfit = totalNetWorth - baselineSnapshot.totalNetWorth - netCapitalFlowSinceBaseline;

            const baseForPercent = baselineSnapshot.totalNetWorth + netCapitalFlowSinceBaseline;
            if (baseForPercent > 0) {
                dailyChangePercent = (dailyProfit / baseForPercent) * 100;
            }

            // Calculate "Yesterday Profit" (Profit of the baseline day itself)
            // Need the snapshot BEFORE the baseline to do this
            const dayBeforeDate = new Date(baseDate);
            dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
            const dayBeforeYMD = dayBeforeDate.toLocaleDateString('en-CA');
            const dayBeforeStartOfDay = new Date(`${dayBeforeYMD}T00:00:00${TIME_ZONE_OFFSET}`);

            const prevSnapshot = await db.portfolioSnapshot.findFirst({
                where: {
                    userId: targetUserId,
                    date: dayBeforeStartOfDay
                }
            });

            if (prevSnapshot) {
                yesterdayProfit = baselineSnapshot.totalProfit - prevSnapshot.totalProfit;
            } else {
                yesterdayProfit = baselineSnapshot.totalProfit;
            }
        }
    }

    return {
        totalNetWorth,
        totalProfit: adjustedProfit,
        totalCost,
        dailyProfit,
        dailyChangePercent,
        yesterdayProfit,
        cashRatioString: "0%",
        totalPrincipal,
        totalReturnRate: adjustedReturnRate,
        annualizedReturn,
        adjustedCostBasis
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
        date: s.date.toISOString(),
        // 服务端直接返回北京时间日期字符串，避免客户端时区换算出错
        displayDate: s.date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE }),
        value: s.totalNetWorth,
        cost: s.totalCost,
        profit: s.totalProfit
    }));
};

// Internal helper for single user snapshot
const createSnapshotForUser = async (userId: number, forceUpdate: boolean = false) => {
    const now = new Date();
    const { todayYMD, isPastCutoff } = getShanghaiTimeContext(now);

    // 快照归属日期规则（两种触发方式行为不同）：
    // - Cron (forceUpdate=true): 始终存为今天 — cron 就是负责结算当日数据
    // - 客户端刷新 (forceUpdate=false): 未到截止=今天，过了截止=明天（开启下一日基准追踪）
    let snapshotYMD = todayYMD;
    if (!forceUpdate && isPastCutoff) {
        const d = new Date(`${todayYMD}T12:00:00${TIME_ZONE_OFFSET}`);
        d.setDate(d.getDate() + 1);
        snapshotYMD = d.toLocaleDateString('en-CA');
    }
    const targetSnapshotDate = new Date(`${snapshotYMD}T00:00:00${TIME_ZONE_OFFSET}`);

    // If not forcing update (Client side check), checks if exists
    if (!forceUpdate) {
        const existing = await db.portfolioSnapshot.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: targetSnapshotDate
                }
            }
        });
        if (existing) {
            // Snapshot already exists for this baseline, do not overwrite with live data
            return;
        }
    }

    // Calculate current stats
    const summary = await getPortfolioSummary(userId);

    // Use Total Principal (Net Inflow) as Cost Basis if available, otherwise fallback to Asset Cost
    // This ensures the "Cost" line on charts reflects the actual capital invested by the user
    const snapshotCost = summary.totalPrincipal > 0 ? summary.totalPrincipal : summary.totalCost;

    // Upsert snapshot for the baseline date to ensure it reflects latest state
    await db.portfolioSnapshot.upsert({
        where: {
            userId_date: {
                userId,
                date: targetSnapshotDate
            }
        },
        create: {
            userId,
            date: targetSnapshotDate,
            totalNetWorth: summary.totalNetWorth,
            totalCost: snapshotCost,
            totalProfit: summary.totalProfit, // Note: summary.totalProfit is already adjusted (NetWorth - Principal) if Principal > 0
            adjustedCostBasis: summary.adjustedCostBasis
        },
        update: {
            totalNetWorth: summary.totalNetWorth,
            totalCost: snapshotCost,
            totalProfit: summary.totalProfit,
            adjustedCostBasis: summary.adjustedCostBasis
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
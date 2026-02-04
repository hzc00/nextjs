"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { executeAction } from "@/lib/executeAction";
import { revalidatePath } from "next/cache";
import YahooFinance from 'yahoo-finance2';
import iconv from 'iconv-lite';

const yahooFinance = new YahooFinance();

// --- Types ---
type AssetSource = 'TENCENT' | 'YAHOO' | 'UNKNOWN';

// --- Helpers ---

/**
 * Identify the source based on the symbol format.
 * Rule A: 6 digits -> CN (Tencent) - Funds or A-shares implied
 * Rule B: 1-5 letters -> US (Yahoo)
 * Rule C: Suffix (.SS, .SZ, .HK) -> CN/HK (Tencent for Chinese names)
 */
function identifySymbolSource(code: string): AssetSource {
    const cleanCode = code.trim();
    // Rule A: 6 digits (A-Shares/Funds) or 5 digits (HK Stocks)
    if (/^\d{5,6}$/.test(cleanCode)) {
        return 'TENCENT';
    }

    // Rule C: Suffix (.SS, .SZ, .HK)
    if (cleanCode.endsWith('.SS') || cleanCode.endsWith('.SZ') || cleanCode.endsWith('.HK')) {
        return 'TENCENT';
    }

    // Rule B: 1-5 Letters (US Stocks)
    // Note: Some US stocks (like BRK.B) have dots, but usually just letters.
    // If it's pure letters, definitely Yahoo.
    if (/^[a-zA-Z]{1,5}$/.test(cleanCode)) {
        return 'YAHOO';
    }

    return 'UNKNOWN';
}

/**
 * Convert local symbol to Tencent API format
 * 600519.SS -> sh600519
 * 000001.SZ -> sz000001
 * 00700.HK -> hk00700
 * 000001 (Fund/Stock) -> Guessing logic
 */
function toTencentCode(code: string): string {
    // Remove dots for processing
    const clean = code.trim().replace('.', '');

    // Explicit Suffix
    if (code.endsWith('.SS')) return `sh${code.replace('.SS', '')}`;
    if (code.endsWith('.SZ')) return `sz${code.replace('.SZ', '')}`;
    if (code.endsWith('.HK')) return `hk${code.replace('.HK', '')}`;

    // 5 Digits (HK)
    if (/^\d{5}$/.test(clean)) {
        return `hk${clean}`;
    }

    // 6 Digits (Guessing)
    if (/^\d{6}$/.test(clean)) {
        // Ambiguity: 000001 can be sz000001 (PingAn) or jj000001 (Huaxia Fund)
        // Usage: For simple "price refresh", if we don't store suffix, we might guess wrong.
        // But usually frontend sends correct suffix if user selected from search.
        // If user manually entered 000001, we default to Fund (jj) per user request about "OTC Funds".
        return `jj${clean}`;
    }

    return clean;
}

/**
 * Fetch data from Tencent (qt.gtimg.cn)
 * Returns GBK decoded string
 */
async function fetchFromTencent(codes: string[]): Promise<Map<string, any>> {
    const tencentCodes = codes.map(toTencentCode);
    // Deduplicate
    const uniqueCodes = Array.from(new Set(tencentCodes));
    if (uniqueCodes.length === 0) return new Map();

    const url = `http://qt.gtimg.cn/q=${uniqueCodes.join(',')}`;


    try {
        const response = await fetch(url, { cache: 'no-store' });
        const buffer = await response.arrayBuffer();
        const text = iconv.decode(Buffer.from(buffer), 'gbk');

        // Parse: v_sh600519="1~贵州茅台~300.00~...";
        const results = new Map<string, any>();
        const lines = text.split(';');

        lines.forEach(line => {
            if (line.trim().length < 10) return;

            // Extract var name: v_sh600519
            const [lhs, rhs] = line.split('=');
            if (!rhs) return;
            // Remove v_ prefix
            const key = lhs.split('v_')[1];

            const valStr = rhs.replace(/"/g, '');
            const values = valStr.split('~');

            const isFund = key.startsWith('jj');

            let name = '';
            let price = 0;

            if (isFund) {
                // Fund: v_jj000001="Code~Name~NAV~AccumulatedNAV~..."
                name = values[1];
                // Index 2 is often 0 or empty for funds. 
                // Index 5 is commonly Unit NAV (Unit Net Value).
                price = parseFloat(values[5]);
            } else {
                // Stock (sh/sz/hk): v_sh600519="1~Name~Code~Price~..."
                name = values[1];
                price = parseFloat(values[3]);
            }



            if (name && !isNaN(price)) {
                results.set(key, { name, price, currency: key.startsWith('hk') ? 'HKD' : 'CNY' });
            }
        });

        return results;

    } catch (error) {
        console.error("Tencent Fetch Error:", error);
        return new Map();
    }
}


export const refreshAllAssetPrices = async () => {
    return executeAction({
        actionFn: async () => {
            const assets = await db.asset.findMany();
            if (assets.length === 0) return;

            // Group by Source
            const tencentQueries: string[] = [];
            const yahooQueries: string[] = [];
            const assetMap = new Map<string, typeof assets[0]>();

            for (const asset of assets) {
                const source = identifySymbolSource(asset.code);
                assetMap.set(asset.code, asset);

                if (source === 'TENCENT') {
                    tencentQueries.push(asset.code);
                } else if (source === 'YAHOO') {
                    yahooQueries.push(asset.code);
                } else {
                    // Unknown - default to Yahoo just in case
                    yahooQueries.push(asset.code);
                }
            }

            // 1. Fetch Tencent
            // Only update PRICE, do not overwrite Name (per requirement)
            if (tencentQueries.length > 0) {
                const tencentResults = await fetchFromTencent(tencentQueries);
                for (const code of tencentQueries) {
                    const tCode = toTencentCode(code);
                    const data = tencentResults.get(tCode);
                    if (data) {
                        const asset = assetMap.get(code);
                        if (asset) {
                            await db.asset.update({
                                where: { id: asset.id },
                                data: { currentPrice: data.price }
                            });
                        }
                    }
                }
            }

            // 2. Fetch Yahoo
            if (yahooQueries.length > 0) {
                try {
                    const quotes = await yahooFinance.quote(yahooQueries, {}, { validateResult: false });
                    for (const quote of quotes) {
                        const symbol = quote.symbol;
                        const price = quote.regularMarketPrice;
                        const asset = assetMap.get(symbol);
                        if (asset && price) {
                            await db.asset.update({
                                where: { id: asset.id },
                                data: { currentPrice: price }
                            });
                        }
                    }
                } catch (e) {
                    console.error("Yahoo Batch Update Error", e);
                }
            }

            revalidatePath("/overView");
        }
    });
};

export const searchAsset = async (query: string) => {
    try {
        query = query.trim();
        const source = identifySymbolSource(query);
        let candidates: any[] = [];

        // 1. Yahoo Search (Good for US, General Discovery) using zh-CN still helps for some
        try {
            const result = await yahooFinance.search(query, { lang: 'zh-CN', region: 'CN' }, { validateResult: false });
            candidates = result.quotes
                .filter((q: any) => q.isYahooFinance)
                .map((q: any) => ({
                    symbol: q.symbol,
                    name: q.shortname || q.longname || q.symbol,
                    exchange: q.exchange,
                    type: q.quoteType
                }));
        } catch (e) {
            console.warn("Yahoo search skipped", e);
        }

        // 2. If valid Tencent target, try to fetch explicit match (Stock/Fund)
        if (source === 'TENCENT') {
            // Heuristic: Try as Stock (autodetect sh/sz) and Fund (jj)
            // We construct potential tencent codes
            let potentialCodes: string[] = [];

            // Fund
            potentialCodes.push(`jj${query}`);

            // Stock
            // If query has suffix, use it. If not, guess.
            if (query.includes('.')) {
                potentialCodes.push(toTencentCode(query));
            } else {
                if (query.startsWith('6')) potentialCodes.push(`sh${query}`);
                if (query.startsWith('0') || query.startsWith('3')) potentialCodes.push(`sz${query}`);
                if (query.length === 5) potentialCodes.push(`hk${query}`);
            }

            // Fetch
            // Manually fetch raw because our helper toTencentCode assumes 1-to-1
            // Here we want 1-to-many guess
            const url = `http://qt.gtimg.cn/q=${potentialCodes.join(',')}`;
            try {
                const response = await fetch(url, { cache: 'no-store' });
                const buffer = await response.arrayBuffer();
                const text = iconv.decode(Buffer.from(buffer), 'gbk');

                const lines = text.split(';');

                lines.forEach(line => {
                    const [lhs, rhs] = line.split('=');
                    if (!rhs || rhs.includes('v_pv_none')) return; // Check for 'none' response

                    const key = lhs.split('v_')[1];
                    const valStr = rhs.replace(/"/g, '');
                    const values = valStr.split('~');

                    let name = values[1];
                    // Clean name (sometimes has spaces)
                    name = name.trim();

                    // Determine display symbol
                    let displaySymbol = query;
                    if (key.startsWith('sh')) displaySymbol = `${key.substring(2)}.SS`;
                    else if (key.startsWith('sz')) displaySymbol = `${key.substring(2)}.SZ`;
                    else if (key.startsWith('hk')) displaySymbol = `${key.substring(2)}.HK`;
                    else if (key.startsWith('jj')) displaySymbol = key.substring(2); // Fund

                    // Prioritize Tencent: Remove existing Yahoo result if any
                    candidates = candidates.filter(c => c.symbol !== displaySymbol);

                    candidates.unshift({
                        symbol: displaySymbol,
                        name: name,
                        exchange: key.substring(0, 2).toUpperCase(),
                        type: key.startsWith('jj') ? 'FUND' : 'EQUITY'
                    });
                });
            } catch (err) {
                console.error("Tencent Search Fetch Error", err);
            }
        }

        return {
            success: true,
            data: candidates
        };
    } catch (error) {
        console.error("Search Error:", error);
        return { success: false, error: "Search failed" };
    }
};

export const getAssetQuote = async (symbol: string) => {
    try {
        const source = identifySymbolSource(symbol);

        if (source === 'TENCENT') {
            const dataMap = await fetchFromTencent([symbol]);
            const tCode = toTencentCode(symbol);
            const data = dataMap.get(tCode);


            if (data) {
                return {
                    success: true,
                    data: {
                        name: data.name,
                        price: data.price,
                        currency: data.currency,
                        symbol: symbol
                    }
                };
            }
        }

        // Fallback or Yahoo source
        const quote = await yahooFinance.quote(symbol, { lang: 'zh-CN', region: 'CN' }, { validateResult: false }) as any;
        return {
            success: true,
            data: {
                name: quote.longName || quote.shortName || quote.symbol,
                price: quote.regularMarketPrice,
                currency: quote.currency,
                symbol: quote.symbol
            }
        };

    } catch (error) {
        console.error("Quote Error:", error);
        return { success: false, error: "Failed to fetch quote" };
    }
};

import { tryCreateDailySnapshot } from "./asset-queries";

// --- Asset Class Actions ---

export const getAssetClasses = async () => {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    // Allow fetching if no userId (anonymous) to match Asset behavior, or restrict?
    // If strict match:
    const where = userId ? { userId } : { userId: null };

    // However, if Prisma treats null as separate value, we need to be careful.
    // If we want "global" default classes, we might query OR.
    // For now, simple user isolation:
    return db.assetClass.findMany({
        where: where,
        orderBy: { targetPercent: 'desc' }
    });
};

export const upsertAssetClass = async (id: number | undefined, name: string, color: string, targetPercent: number) => {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;
        // if (!userId) return { success: false, error: "Unauthorized" }; 
        // Allow anonymous creation to match Asset creation

        if (id) {
            await db.assetClass.update({
                where: { id },
                data: { name, color, targetPercent }
            });
        } else {
            await db.assetClass.create({
                data: { userId, name, color, targetPercent }
            });
        }
        revalidatePath("/overView");
        return { success: true };
    } catch (error: any) {
        console.error("Upsert Asset Class Error:", error);
        // Handle Unique Constraint
        if (error.code === 'P2002') {
            return { success: false, error: "Class name already exists" };
        }
        return { success: false, error: error.message || "Failed to save asset class" };
    }
};

export const deleteAssetClass = async (id: number) => {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : undefined;
        if (!userId) return { success: false, error: "Unauthorized" };

        await db.assetClass.delete({ where: { id } });
        revalidatePath("/overView");
        return { success: true };
    } catch (error) {
        console.error("Delete Class Error:", error);
        return { success: false, error: "Failed to delete asset class" };
    }
};

export const updateAssetPosition = async (code: string, name: string, quantity: number, avgCost: number, assetClassId?: number) => {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : undefined;

        // Use upsert to handle both create and update atomically
        // This relies on 'code' being @unique in the schema
        await db.asset.upsert({
            where: { code: code },
            update: {
                quantity: quantity,
                avgCost: avgCost,
                // Only update name if a valid one is provided
                ...(name ? { name } : {}),
                assetClassId: assetClassId
            },
            create: {
                code: code,
                name: name,
                type: "STOCK",
                quantity: quantity,
                avgCost: avgCost,
                currentPrice: avgCost,
                userId: userId, // If undefined, it will be null, which is allowed (Int?)
                assetClassId: assetClassId
            }
        });

        // Update Snapshot immediately
        await tryCreateDailySnapshot();

        revalidatePath("/overView");
        return { success: true };
    } catch (error: any) {
        console.error("Update Position Error:", error);
        // Return actual error message for debugging
        return { success: false, error: error.message || "Failed to update position" };
    }
};

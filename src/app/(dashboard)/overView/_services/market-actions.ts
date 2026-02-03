"use server";

import yahooFinance from 'yahoo-finance2';
import db from "@/lib/db";
import { executeAction } from "@/lib/executeAction";
import { revalidatePath } from "next/cache";

// Helper to map Asset Code to Yahoo Ticker
// 00700 -> 00700.HK
// 600519 -> 600519.SS
// 000001 -> 000001.SZ
// AAPL -> AAPL
function mapToYahooTicker(code: string): string {
    // If already has suffix, return as is
    if (code.includes('.')) return code;

    // Hong Kong (5 digits)
    if (/^\d{5}$/.test(code)) {
        return `${code}.HK`;
    }

    // China A-Shares (6 digits)
    if (/^\d{6}$/.test(code)) {
        // Shanghai: starts with 6
        if (code.startsWith('6')) {
            return `${code}.SS`;
        }
        // Shenzhen: starts with 0 or 3
        if (code.startsWith('0') || code.startsWith('3')) {
            return `${code}.SZ`;
        }
        // Beijing: starts with 4 or 8 (usually .BJ), but less common, default to SS or SZ?
        // Let's assume SS for now or leave it to user to provide suffix
    }

    // Default: Assume US Stock or manually correct code
    return code;
}

export const refreshAllAssetPrices = async () => {
    return executeAction({
        actionFn: async () => {
            const assets = await db.asset.findMany();
            if (assets.length === 0) return;

            // 1. Prepare tickers
            const assetMap = new Map<string, typeof assets[0]>();
            const tickers: string[] = [];

            for (const asset of assets) {
                const ticker = mapToYahooTicker(asset.code);
                tickers.push(ticker);
                assetMap.set(ticker, asset);
            }

            // 2. Fetch from Yahoo Finance
            // yahooFinance.quote combines multiple tickers
            const quotes = await yahooFinance.quote(tickers);

            // 3. Update DB
            for (const quote of quotes) {
                const symbol = quote.symbol;
                const price = quote.regularMarketPrice;

                // Find original asset by mapped ticker
                // Note: Yahoo might return symbol slightly differently (uppercase), so we care about matching
                // We'll rely on the order or map matching? 
                // Creating a reverse lookup is safer.

                // Also, quote.symbol usually matches the request.
                const asset = assetMap.get(symbol);
                if (asset && price) {
                    await db.asset.update({
                        where: { id: asset.id },
                        data: { currentPrice: price }
                    });

                    // Also update snapshot for today if exists? 
                    // Or just let the user refresh snapshot logic handle it next time page loads?
                    // Let's just update asset price for now. 
                    // The Snapshot logic uses `getPortfolioSummary` which uses `db.asset` data, so next snapshot will be correct.
                }
            }

            revalidatePath("/overView");
        }
    });
};

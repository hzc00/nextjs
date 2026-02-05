import { refreshAllAssetPrices } from '@/app/(dashboard)/overView/_services/market-actions';
import { createScanningSnapshots } from '@/app/(dashboard)/overView/_services/asset-queries';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(request: Request) {
    // Optional: Add a simple secret check if you want to protect it manually (though Vercel has its own protection)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        console.log("[Cron] Starting Daily Update...");

        // 1. Refresh Prices from Yahoo/Tencent
        console.log("[Cron] Refreshing Prices...");
        await refreshAllAssetPrices();

        // 2. Create/Update Daily Snapshots for All Users
        console.log("[Cron] Creating Snapshots...");
        await createScanningSnapshots();

        return NextResponse.json({ success: true, message: "Daily update completed" });
    } catch (error) {
        console.error("[Cron] Daily Update Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

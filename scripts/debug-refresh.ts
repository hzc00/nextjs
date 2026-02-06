
import { refreshAllAssetPrices } from '../src/app/(dashboard)/overView/_services/market-actions';

async function main() {
    console.log("Starting refresh...");
    await refreshAllAssetPrices();
    console.log("Refresh done.");
}

main().catch(console.error);

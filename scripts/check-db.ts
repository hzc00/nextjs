
import db from "../src/lib/db";

async function main() {
    console.log("Checking DB...");
    const userCount = await db.user.count();
    const assetCount = await db.asset.count();
    const transactionCount = await db.transaction.count();

    console.log(`Users: ${userCount}`);
    console.log(`Assets: ${assetCount}`);
    console.log(`Transactions: ${transactionCount}`);

    if (assetCount > 0) {
        const first = await db.asset.findFirst({ include: { user: true } });
        console.log("First Asset Owner:", first?.user?.email || "No User");
    }
}

main().catch(console.error);

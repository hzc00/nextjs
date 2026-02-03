import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("⚠️ Clearing all investment data (Transactions, Snapshots, Assets)...");

    // 1. Delete Transactions (Depends on Asset)
    const deletedTx = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTx.count} transactions.`);

    // 2. Delete Portfolio Snapshots
    // Note: If you want to keep history for the user regarding total Net Worth but just reset holdings, 
    // you might want to keep this. But "holding related data" usually implies a full reset.
    // I will clear it to ensure a clean slate for the charts.
    const deletedSnapshots = await prisma.portfolioSnapshot.deleteMany({});
    console.log(`✅ Deleted ${deletedSnapshots.count} snapshots.`);

    // 3. Delete Assets
    const deletedAssets = await prisma.asset.deleteMany({});
    console.log(`✅ Deleted ${deletedAssets.count} assets.`);

    console.log("🎉 All investment data cleared. User data remains intact.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

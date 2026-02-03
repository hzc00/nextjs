import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const code = "000700";
    console.log(`Searching for asset with code: ${code}...`);

    const asset = await prisma.asset.findUnique({
        where: { code },
        include: { transactions: true }
    });

    if (!asset) {
        console.log("Asset not found.");
        return;
    }

    console.log(`Found asset: ${asset.name} (ID: ${asset.id})`);
    console.log(`It has ${asset.transactions.length} transactions.`);

    // 1. Delete Transactions first
    if (asset.transactions.length > 0) {
        const deletedTx = await prisma.transaction.deleteMany({
            where: { assetId: asset.id }
        });
        console.log(`Deleted ${deletedTx.count} transactions.`);
    }

    // 2. Delete Asset
    await prisma.asset.delete({
        where: { id: asset.id }
    });

    console.log("Asset deleted successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

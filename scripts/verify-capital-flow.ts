
import db from '../src/lib/db';
import { getPortfolioSummary } from '../src/app/(dashboard)/overView/_services/asset-queries';

async function main() {
    console.log("Starting Capital Flow Verification...");

    // 1. Get a user
    const user = await db.user.findFirst();
    if (!user) {
        console.error("No user found. Please seed the database.");
        return;
    }
    const userId = user.id;
    console.log(`Testing with User ID: ${userId}`);

    // 2. Initial State
    const initialSummary = await getPortfolioSummary(userId);
    console.log("Initial Principal:", initialSummary.totalPrincipal);

    // 3. Add Deposit
    const depositAmount = 10000;
    console.log(`Adding Deposit: ${depositAmount}`);
    const depositTx = await db.transaction.create({
        data: {
            userId,
            type: 'DEPOSIT',
            quantity: depositAmount,
            price: 1,
            totalAmount: depositAmount,
            date: new Date(),
            notes: 'Verification Script Deposit'
        }
    });

    // 4. Verify after Deposit
    const summaryAfterDeposit = await getPortfolioSummary(userId);
    console.log("Principal after Deposit:", summaryAfterDeposit.totalPrincipal);
    
    const expectedPrincipalAfterDeposit = initialSummary.totalPrincipal + depositAmount;
    if (Math.abs(summaryAfterDeposit.totalPrincipal - expectedPrincipalAfterDeposit) < 0.01) {
        console.log("✅ Deposit verification passed");
    } else {
        console.error(`❌ Deposit verification failed. Expected ${expectedPrincipalAfterDeposit}, got ${summaryAfterDeposit.totalPrincipal}`);
    }

    // 5. Add Withdrawal
    const withdrawAmount = 5000;
    console.log(`Adding Withdrawal: ${withdrawAmount}`);
    const withdrawTx = await db.transaction.create({
        data: {
            userId,
            type: 'WITHDRAW',
            quantity: withdrawAmount,
            price: 1,
            totalAmount: withdrawAmount,
            date: new Date(),
            notes: 'Verification Script Withdraw'
        }
    });

    // 6. Verify after Withdrawal
    const summaryAfterWithdraw = await getPortfolioSummary(userId);
    console.log("Principal after Withdrawal:", summaryAfterWithdraw.totalPrincipal);

    const expectedPrincipalAfterWithdraw = expectedPrincipalAfterDeposit - withdrawAmount;
    if (Math.abs(summaryAfterWithdraw.totalPrincipal - expectedPrincipalAfterWithdraw) < 0.01) {
        console.log("✅ Withdrawal verification passed");
    } else {
        console.error(`❌ Withdrawal verification failed. Expected ${expectedPrincipalAfterWithdraw}, got ${summaryAfterWithdraw.totalPrincipal}`);
    }

    // 7. Clean up
    console.log("Cleaning up verification transactions...");
    await db.transaction.delete({ where: { id: depositTx.id } });
    await db.transaction.delete({ where: { id: withdrawTx.id } });
    console.log("Clean up finished.");
}

main()
    .catch(e => {
        console.error("Verification Script Error:", e);
    })
    .finally(async () => {
        await db.$disconnect();
    });

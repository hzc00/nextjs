"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OverviewMetricCards } from "./_components/overview-metric-cards";
import { OverviewCharts } from "./_components/overview-charts";
import { OverviewPositionsTable } from "./_components/overview-positions-table";
import { RefreshPricesButton } from "./_components/refresh-prices-button";
import { tryCreateDailySnapshot } from "./_services/asset-queries";
import { TransactionDialog } from "./_components/transaction-dialog";

export default function OverviewPage() {
    const [globalTransactionOpen, setGlobalTransactionOpen] = useState(false);

    React.useEffect(() => {
        // Try to create a snapshot when visiting the page
        tryCreateDailySnapshot();
    }, []);

    return (
        <div className="flex flex-col space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <div className="flex items-center space-x-2">
                    <RefreshPricesButton />
                    <Button onClick={() => setGlobalTransactionOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record
                    </Button>
                </div>
            </header>

            {/* 1. Metic Cards */}
            <OverviewMetricCards />

            {/* 2. Charts Area */}
            <OverviewCharts />

            {/* 3. Positions Table */}
            <OverviewPositionsTable />

            <TransactionDialog
                open={globalTransactionOpen}
                onOpenChange={setGlobalTransactionOpen}
                defaultType="BUY"
            />
        </div>
    );
}

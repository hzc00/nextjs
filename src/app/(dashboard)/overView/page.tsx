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
import { StrategyManageDialog } from "./_components/strategy-manage-dialog";
import { Settings2 } from "lucide-react";

export default function OverviewPage() {
    const [globalTransactionOpen, setGlobalTransactionOpen] = useState(false);
    const [strategyOpen, setStrategyOpen] = useState(false);

    React.useEffect(() => {
        // Try to create a snapshot when visiting the page
        tryCreateDailySnapshot();
    }, []);

    return (
        <div className="flex flex-col space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <RefreshPricesButton />
                    <Button variant="outline" size="sm" onClick={() => setStrategyOpen(true)}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Strategy</span>
                    </Button>
                    <Button size="sm" onClick={() => setGlobalTransactionOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Add Position</span>
                        <span className="inline sm:hidden">Add</span>
                    </Button>
                </div>
            </header>

            {/* 1. Metic Cards */}
            {/* <OverviewMetricCards /> */}

            {/* 2. Charts Area */}
            <OverviewCharts />

            {/* 3. Positions Table */}
            <OverviewPositionsTable />

            <TransactionDialog
                open={globalTransactionOpen}
                onOpenChange={setGlobalTransactionOpen}
            />

            <StrategyManageDialog
                open={strategyOpen}
                onOpenChange={setStrategyOpen}
            />
        </div>
    );
}

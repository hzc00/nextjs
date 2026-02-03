"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OverviewMetricCards } from "./_components/overview-metric-cards";
import { OverviewCharts } from "./_components/overview-charts";
import { OverviewPositionsTable } from "./_components/overview-positions-table";
import { TransactionDialog } from "@/components/dashboard/transaction-dialog";

export default function OverviewPage() {
    const [globalTransactionOpen, setGlobalTransactionOpen] = useState(false);

    return (
        <div className="flex flex-col space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <Button onClick={() => setGlobalTransactionOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Record
                </Button>
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

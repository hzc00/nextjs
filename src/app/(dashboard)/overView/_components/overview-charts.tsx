"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationPie } from "@/components/charts/asset-allocation-pie";
import { AssetTrendContainer } from "@/components/dashboard/asset-trend-container";
import { MOCK_ALLOCATION_DATA } from "@/data/mock-overview";

export function OverviewCharts() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Left 2/3: Asset Trend */}
            <AssetTrendContainer />

            {/* Right 1/3: Asset Allocation */}
            <Card className="col-span-1 shadow-sm">
                <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px] p-0 flex items-center justify-center">
                    <div className="h-full w-full">
                        <AssetAllocationPie data={MOCK_ALLOCATION_DATA} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

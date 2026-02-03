"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationPie } from "./charts/asset-allocation-pie";
import { AssetTrendContainer } from "./asset-trend-container";
import { useAssetAllocation } from "../_services/use-asset-queries";
import { Loader2 } from "lucide-react";

export function OverviewCharts() {
    const { data: allocationData, isLoading } = useAssetAllocation();

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
                    {isLoading ? (
                        <Loader2 className="animate-spin text-muted-foreground" />
                    ) : (
                        <div className="h-full w-full">
                            <AssetAllocationPie data={allocationData || []} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

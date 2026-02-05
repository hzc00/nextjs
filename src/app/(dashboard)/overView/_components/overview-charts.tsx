"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationPie } from "./charts/asset-allocation-pie";
import { AssetTrendContainer } from "./asset-trend-container";
import { useAssetAllocation } from "../_services/use-asset-queries";
import { Loader2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllocationGapChart } from "./charts/allocation-gap-chart";
import { useAllocationGap } from "../_services/use-asset-queries";

export function OverviewCharts() {
    const { data: allocationData, isLoading: loadingAllocation } = useAssetAllocation();
    const { data: gapData, isLoading: loadingGap } = useAllocationGap();

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Left 2/3: Asset Trend */}
            <AssetTrendContainer />

            {/* Right 1/3: Asset Allocation */}
            <Card className="col-span-1 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-normal">Allocation</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px] p-0">
                    <Tabs defaultValue="strategy" className="h-full w-full flex flex-col">
                        <div className="px-4 pb-2">
                            <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="strategy" className="text-xs">Strategy</TabsTrigger>
                                <TabsTrigger value="type" className="text-xs">By Type</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="type" className="flex-1 min-h-0 mt-0">
                            {loadingAllocation ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="h-full w-full">
                                    <AssetAllocationPie data={allocationData || []} />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="strategy" className="flex-1 min-h-0 mt-0 p-2">
                            {loadingGap ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="h-full w-full">
                                    {(gapData || []).length > 0 ? (
                                        <AllocationGapChart data={gapData || []} />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground text-xs">
                                            <p>No strategy targets set.</p>
                                            <p>Use &quot;Configure Strategy&quot; to add classes.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

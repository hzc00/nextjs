"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AssetTrendChart } from "./charts/asset-trend-chart";
import { usePortfolioSnapshots } from "../_services/use-asset-queries";

export function AssetTrendContainer() {
    const [range, setRange] = useState<"week" | "month" | "year">("week");
    const [showPercentage, setShowPercentage] = useState(false);

    const { data: snapshots } = usePortfolioSnapshots();

    // Transform snapshots to chart data
    // If no data, use empty array
    const rawData = (snapshots || []).map(s => ({
        date: s.date,
        value: s.value
    }));

    // Filter based on range (Mocking filtering for now or just show all if small)
    // For now, let's just show all available data as we are just starting
    // Ideally we filter by date relative to now.

    const displayValues = showPercentage
        ? rawData.map((item, i, arr) => {
            if (i === 0) return 0;
            const startVal = arr[0].value;
            if (startVal === 0) return 0;
            return Number((((item.value - startVal) / startVal) * 100).toFixed(2));
        })
        : rawData.map(d => d.value);

    const chartData = {
        dates: rawData.map(d => d.date),
        values: displayValues,
    };

    return (
        <Card className="col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">Asset Trend</CardTitle>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="percentage-mode"
                            checked={showPercentage}
                            onCheckedChange={setShowPercentage}
                        />
                        <Label htmlFor="percentage-mode" className="text-xs text-muted-foreground">
                            Yield %
                        </Label>
                    </div>
                    {/* Range tabs disabled for now as we don't have enough history */}
                    <Tabs
                        defaultValue="week"
                        value={range}
                        onValueChange={(val) => setRange(val as "week" | "month" | "year")}
                        className="w-auto"
                    >
                        <TabsList className="h-8">
                            <TabsTrigger value="week" className="text-xs px-2 h-6">1W</TabsTrigger>
                            <TabsTrigger value="month" className="text-xs px-2 h-6">1M</TabsTrigger>
                            <TabsTrigger value="year" className="text-xs px-2 h-6">1Y</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="h-[320px] p-0">
                <div className="h-full w-full">
                    {/* Handle empty state */}
                    {chartData.dates.length > 0 ? (
                        <AssetTrendChart
                            data={chartData}
                            isPercentage={showPercentage}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No history data yet.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

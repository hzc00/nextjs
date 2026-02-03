"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AssetTrendChart } from "@/components/charts/asset-trend-chart";
import { MOCK_TREND_DATA } from "@/data/mock-overview";

export function AssetTrendContainer() {
    const [range, setRange] = useState<"week" | "month" | "year">("week");
    const [showPercentage, setShowPercentage] = useState(false);

    // 获取当前选择范围内的数据
    const currentData = MOCK_TREND_DATA[range];

    // 计算显示数据（数值 或 百分比收益率）
    const displayValues = showPercentage
        ? currentData.values.map((val) => {
            const startVal = currentData.values[0];
            if (startVal === 0) return 0;
            return Number((((val - startVal) / startVal) * 100).toFixed(2));
        })
        : currentData.values;

    const chartData = {
        dates: currentData.dates,
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
                    <Tabs
                        defaultValue="week"
                        value={range}
                        onValueChange={(val) => setRange(val as "week" | "month" | "year")}
                        className="w-auto"
                    >
                        <TabsList className="h-8">
                            <TabsTrigger value="week" className="text-xs px-2 h-6">
                                1W
                            </TabsTrigger>
                            <TabsTrigger value="month" className="text-xs px-2 h-6">
                                1M
                            </TabsTrigger>
                            <TabsTrigger value="year" className="text-xs px-2 h-6">
                                1Y
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="h-[320px] p-0">
                <div className="h-full w-full">
                    <AssetTrendChart
                        data={chartData}
                        isPercentage={showPercentage}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

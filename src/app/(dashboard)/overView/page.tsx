"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    MOCK_ASSET_METRICS,
    MOCK_ACCOUNTS,
    MOCK_ALLOCATION_DATA,
    MOCK_POSITIONS,
} from "@/data/mock-overview";
import { AssetAllocationPie } from "@/components/charts/asset-allocation-pie";
import { AssetTrendContainer } from "@/components/dashboard/asset-trend-container";

export default function OverviewPage() {
    return (
        <div className="flex flex-col space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            </header>

            {/* 1. Metic Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {MOCK_ASSET_METRICS.map((metric, index) => {
                    const isPnl = metric.isPnl;
                    const valueColor = isPnl
                        ? (metric.value as number) >= 0
                            ? "text-red-500"
                            : "text-green-500"
                        : "text-foreground";

                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {metric.title}
                                </CardTitle>
                                {metric.currency && (
                                    <span className="text-muted-foreground font-bold">
                                        {metric.currency}
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${valueColor}`}>
                                    {typeof metric.value === "number"
                                        ? metric.value.toLocaleString()
                                        : metric.value}
                                </div>
                                {metric.desc && (
                                    <p className="text-xs text-muted-foreground">{metric.desc}</p>
                                )}
                                {metric.change !== undefined && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metric.change > 0 ? "+" : ""}
                                        {metric.change}% 较昨日
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 2. Charts Area */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Left 2/3: Asset Trend */}
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

            {/* 3. Positions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Daily %</TableHead>
                                <TableHead className="text-right">P&L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_POSITIONS.map((position) => {
                                const isProfit = position.totalProfit >= 0;
                                const isDailyUp = position.dailyChange >= 0;

                                return (
                                    <TableRow key={position.id}>
                                        <TableCell className="font-mono text-muted-foreground">
                                            {position.code}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {position.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={position.assetType === "STOCK" ? "default" : "secondary"}>
                                                {position.assetType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {position.currentPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {position.avgCost.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {position.quantity.toLocaleString()}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${isDailyUp ? "text-red-500" : "text-green-500"}`}>
                                            {position.dailyChange > 0 ? "+" : ""}
                                            {position.dailyChange}%
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${isProfit ? "text-red-500" : "text-green-500"}`}>
                                            {position.totalProfit > 0 ? "+" : ""}
                                            {position.totalProfit.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    MOCK_ASSET_METRICS,
    MOCK_ACCOUNTS,
    MOCK_TREND_DATA,
    MOCK_ALLOCATION_DATA,
} from "@/data/mock-overview";
import { AssetTrendChart } from "@/components/charts/asset-trend-chart";
import { AssetAllocationPie } from "@/components/charts/asset-allocation-pie";

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
                <Card className="col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>近七日资产走势</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px] p-0">
                        <div className="h-full w-full">
                            <AssetTrendChart data={MOCK_TREND_DATA} />
                        </div>
                    </CardContent>
                </Card>

                {/* Right 1/3: Asset Allocation */}
                <Card className="col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle>资产分布</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px] p-0 flex items-center justify-center">
                        <div className="h-full w-full">
                            <AssetAllocationPie data={MOCK_ALLOCATION_DATA} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Account Details Table */}
            <Card>
                <CardHeader>
                    <CardTitle>资金账户详情</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>账户名称</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead className="text-right">当前余额</TableHead>
                                <TableHead className="w-[30%]">占比</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_ACCOUNTS.map((account) => {
                                const percentage = (account.balance / account.totalAssets) * 100;
                                return (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">
                                            {account.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{account.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            ¥{account.balance.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={percentage} className="h-2" />
                                                <span className="text-xs text-muted-foreground w-10">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
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

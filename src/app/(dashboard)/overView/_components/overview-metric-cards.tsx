"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "../_services/use-asset-queries";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function OverviewMetricCards() {
  const { data: summary, isLoading } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="h-32 flex items-center justify-center border-none bg-muted/20">
            <Loader2 className="animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 1. Total Assets / Cost Basis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assets / Cost
          </CardTitle>
          <span className="text-muted-foreground font-bold">¥</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold">
              {formatCurrency(summary?.totalNetWorth || 0)}
            </span>
            <span className="text-muted-foreground text-xs">
              / {formatCurrency(summary?.totalCost || 0)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">
            Valuation vs Principal
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Cumulative Profit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Profit
          </CardTitle>
          <span className="text-muted-foreground font-bold">¥</span>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", (summary?.totalProfit || 0) >= 0 ? "text-red-500" : "text-green-500")}>
            {(summary?.totalProfit || 0) > 0 ? "+" : ""}
            {formatCurrency(summary?.totalProfit || 0)}
          </div>
          <div className="flex items-center mt-1">
            <span className={cn("text-xs font-semibold", (summary?.totalProfit || 0) >= 0 ? "text-red-500" : "text-green-500")}>
              {summary?.totalCost && summary.totalCost !== 0
                ? `${((summary.totalProfit / summary.totalCost) * 100).toFixed(2)}%`
                : "0.00%"}
            </span>
            <span className="text-xs text-muted-foreground ml-2">Cumulative</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Daily Profit Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Daily Profit
          </CardTitle>
          <span className="text-muted-foreground font-bold text-xs">Today</span>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", (summary?.dailyProfit || 0) >= 0 ? "text-red-500" : "text-green-500")}>
            {(summary?.dailyProfit || 0) > 0 ? "+" : ""}
            {formatCurrency(summary?.dailyProfit || 0)}
          </div>
          <div className="flex items-center mt-1 text-xs">
            {(summary?.dailyChangePercent || 0) !== 0 && (
              <div className={cn("flex items-center font-medium", (summary?.dailyChangePercent || 0) > 0 ? "text-red-500" : "text-green-500")}>
                {(summary?.dailyChangePercent || 0) > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(summary?.dailyChangePercent || 0).toFixed(2)}%
              </div>
            )}
            <span className="text-muted-foreground ml-2 uppercase tracking-tighter text-[10px]">Movement</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

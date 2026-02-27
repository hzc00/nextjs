"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "../_services/use-asset-queries";
import { Loader2, ArrowUp, ArrowDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Determine cost basis display
  const costBasis = summary?.adjustedCostBasis || summary?.totalCost || 0;
  const basisLabel = summary?.adjustedCostBasis ? "Cost Basis" : "Total Cost";

  // Return Rates
  const simpleReturnRate = summary?.totalReturnRate ? summary.totalReturnRate * 100 : 0;
  const xirrRate = summary?.annualizedReturn;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 1. Net Worth / Cost Basis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Net Worth / {basisLabel}
          </CardTitle>
          <span className="text-muted-foreground font-bold">¥</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">
              {formatCurrency(summary?.totalNetWorth || 0)}
            </span>
            <span className="text-muted-foreground text-sm">
              / {formatCurrency(costBasis)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">
            Adjusted for capital withdrawals
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Cumulative Profit & XIRR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Total Return
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total Profit / {basisLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {summary?.adjustedCostBasis
                      ? "Simple return based on proportional adjusted cost basis"
                      : "Based on absolute asset cost"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <span className="text-muted-foreground font-bold">¥</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={cn("text-2xl font-bold", (summary?.totalProfit || 0) >= 0 ? "text-red-500" : "text-green-500")}>
                {(summary?.totalProfit || 0) > 0 ? "+" : ""}
                {formatCurrency(summary?.totalProfit || 0)}
              </div>
              <div className="flex items-center mt-1">
                <span className={cn("text-xs font-semibold", (simpleReturnRate) >= 0 ? "text-red-500" : "text-green-500")}>
                  {(simpleReturnRate) > 0 ? "+" : ""}{simpleReturnRate.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground ml-2">Simple</span>
              </div>
            </div>

            {/* XIRR Display block on the right side if available */}
            {/* XIRR Display block on the right side */}
            <div className="text-right">
              <div className={cn("text-lg font-bold", (xirrRate || 0) >= 0 ? "text-red-500" : "text-green-500")}>
                {(xirrRate || 0) > 0 ? "+" : ""}{(xirrRate || 0).toFixed(2)}%
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">
                XIRR (Annual)
              </div>
            </div>
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
          <div className="flex flex-col mt-1 space-y-1">
            <div className="flex items-center text-xs">
              {(summary?.dailyChangePercent || 0) !== 0 && (
                <div className={cn("flex items-center font-medium", (summary?.dailyChangePercent || 0) > 0 ? "text-red-500" : "text-green-500")}>
                  {(summary?.dailyChangePercent || 0) > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                  {Math.abs(summary?.dailyChangePercent || 0).toFixed(2)}%
                </div>
              )}
              <span className="text-muted-foreground ml-2 uppercase tracking-tighter text-[10px]">vs Yesterday</span>
            </div>
            {/* Show Yesterday Profit if available for comparison context */}
            {(summary?.yesterdayProfit !== undefined) && (
              <div className="text-[10px] text-muted-foreground">
                Yesterday: <span className={summary.yesterdayProfit >= 0 ? "text-red-500" : "text-green-500"}>
                  {summary.yesterdayProfit > 0 ? "+" : ""}{formatCurrency(summary.yesterdayProfit)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

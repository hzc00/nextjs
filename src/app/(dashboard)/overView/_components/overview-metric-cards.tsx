"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "../_services/use-asset-queries";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";

export function OverviewMetricCards() {
  const { data: summary, isLoading } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="h-32 flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Assets",
      value: summary?.totalNetWorth || 0,
      currency: "¥",
      change: 0, // Placeholder
      isPnl: false,
    },
    {
      title: "Total Profit",
      value: summary?.totalProfit || 0,
      currency: "¥",
      isPnl: true,
    },
    {
      title: "Cost Basis",
      value: summary?.totalCost || 0,
      currency: "¥",
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric, index) => {
        const isPnl = metric.isPnl;
        const value = metric.value as number;
        // Logic for color: PnL is Red(+)/Green(-), others are default
        // In China Red is up/positive, Green is down/negative usually.
        // Let's assume standard international for now or stick to the user's seeming preference?
        // Mock data used Red=Positive, Green=Negative logic (implied by previous code).
        const valueColor = isPnl
          ? value >= 0
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
                {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {metric.change !== undefined && metric.change !== 0 && (
                <p className="text-muted-foreground mt-1 text-xs flex items-center">
                  {metric.change > 0 ? <ArrowUp className="h-3 w-3 mr-1 text-red-500" /> : <ArrowDown className="h-3 w-3 mr-1 text-green-500" />}
                  {Math.abs(metric.change)}% 较昨日
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

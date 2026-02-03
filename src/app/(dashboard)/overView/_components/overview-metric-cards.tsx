"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_ASSET_METRICS } from "@/data/mock-overview";

export function OverviewMetricCards() {
  return (
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
                <p className="text-muted-foreground text-xs">{metric.desc}</p>
              )}
              {metric.change !== undefined && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}% 较昨日
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

interface RebalanceChartProps {
    data: {
        name: string;
        actual: number;
        target: number;
        color: string;
        totalValue?: number;
        targetValue?: number;
        valDiff?: number;
    }[];
}

export function RebalanceChart({ data }: RebalanceChartProps) {
    // Format currency helper
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(Math.abs(val));
    };

    return (
        <div className="space-y-4 p-4 h-full overflow-y-auto custom-scrollbar">
            {data.map((item) => {
                const diff = item.valDiff || 0;
                const isAdd = diff > 0;
                const isBalanced = Math.abs(diff) < 100; // Treat small diffs as balanced

                return (
                    <div key={item.name} className="flex flex-col space-y-2">
                        {/* Header: Name and Percentage */}
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="font-medium text-foreground">{item.name}</span>
                            </div>
                            <div className="text-muted-foreground text-xs flex gap-2">
                                <span>Actual: <span className="font-mono text-foreground">{item.actual}%</span></span>
                                <span>/</span>
                                <span>Target: <span className="font-mono text-foreground">{item.target}%</span></span>
                            </div>
                        </div>

                        {/* Progress Bar Visual */}
                        <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
                            {/* Target Marker (Ghost) */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
                                style={{ left: `${Math.min(item.target, 100)}%` }}
                            />
                            {/* Actual Bar */}
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${Math.min(item.actual, 100)}%`,
                                    backgroundColor: item.color
                                }}
                            />
                        </div>

                        {/* Action / Suggestion */}
                        <div className="flex justify-between items-center text-xs mt-1">
                            <div className="text-muted-foreground">
                                Gap: <span className={`${diff > 0 ? "text-red-500" : "text-green-500"}`}>{diff > 0 ? "-" : "+"}{(Math.abs(item.actual - item.target)).toFixed(1)}%</span>
                            </div>
                            
                            {isBalanced ? (
                                <div className="text-muted-foreground flex items-center gap-1">
                                    <span>Balanced</span>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-1 font-medium ${isAdd ? "text-green-500" : "text-orange-500"}`}>
                                    {isAdd ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{isAdd ? "Add" : "Reduce"} {formatCurrency(diff)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    No strategy data available.
                </div>
            )}
        </div>
    );
}

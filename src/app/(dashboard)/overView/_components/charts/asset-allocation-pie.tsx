"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface AssetAllocationPieProps {
    data: {
        value: number;
        name: string;
        color?: string;
    }[];
}

export function AssetAllocationPie({ data }: AssetAllocationPieProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    // Predefined colors as fallback
    const fallbackColors = [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
        "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#06b6d4"
    ];

    const processedData = data
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
            ...item,
            color: item.color || fallbackColors[index % fallbackColors.length],
            percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0
        }));

    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "item",
            valueFormatter: (value: number) => `¥${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        legend: {
            show: false, // Hide default legend
        },
        series: [
            {
                name: "Asset Allocation",
                type: "pie",
                radius: ["50%", "80%"],
                center: ["50%", "50%"],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 5,
                    borderColor: isDark ? "#1f2937" : "#fff",
                    borderWidth: 2,
                },
                label: {
                    show: false,
                    position: "center",
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: "bold",
                        formatter: "{b}\n{d}%",
                        color: isDark ? "#fff" : "#000",
                    },
                },
                labelLine: {
                    show: false,
                },
                data: processedData.map(item => ({
                    value: item.value,
                    name: item.name,
                    itemStyle: { color: item.color }
                })),
            },
        ],
    };

    return (
        <div className="flex flex-col md:flex-row h-full items-center p-2 gap-4">
            {/* Chart Section */}
            <div className="h-[200px] w-full md:w-1/2 md:h-full relative flex-shrink-0">
                 <ReactECharts 
                    option={option} 
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: 'svg' }} 
                />
            </div>

            {/* List Section */}
            <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar max-h-[160px] md:max-h-full">
                <div className="space-y-3">
                    {processedData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                                <span 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">
                                    {item.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    ¥{item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

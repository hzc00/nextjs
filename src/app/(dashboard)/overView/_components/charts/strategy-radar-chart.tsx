"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface StrategyRadarProps {
    data: {
        name: string;
        actual: number;
        target: number;
        color: string;
    }[];
}

export function StrategyRadarChart({ data }: StrategyRadarProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Calculate max value for the radar indicators to scale properly
    // Add some buffer (e.g. 10%)
    const allValues = [
        ...data.map(d => d.actual),
        ...data.map(d => d.target)
    ];
    const maxValue = Math.max(...allValues, 0) * 1.2; 

    // ECharts option
    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "item",
        },
        legend: {
            bottom: "0%",
            left: "center",
            data: ["Actual", "Target"],
            textStyle: {
                color: isDark ? "#9ca3af" : "#374151",
            },
        },
        radar: {
            indicator: data.map(item => ({
                name: item.name,
                max: maxValue > 0 ? maxValue : 100 // Fallback if no data
            })),
            radius: "65%",
            splitNumber: 4,
            axisName: {
                color: isDark ? "#9ca3af" : "#374151",
            },
            splitLine: {
                lineStyle: {
                    color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                }
            },
            splitArea: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                }
            }
        },
        series: [
            {
                type: "radar",
                data: [
                    {
                        value: data.map(d => d.actual),
                        name: "Actual",
                        itemStyle: {
                            color: "#3b82f6"
                        },
                        areaStyle: {
                            color: "rgba(59, 130, 246, 0.2)"
                        }
                    },
                    {
                        value: data.map(d => d.target),
                        name: "Target",
                        itemStyle: {
                            color: "#10b981" // Green for target
                        },
                        lineStyle: {
                            type: "dashed"
                        },
                        areaStyle: {
                            color: "rgba(16, 185, 129, 0.1)"
                        }
                    }
                ]
            }
        ]
    };

    return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />;
}

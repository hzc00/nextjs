"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface AssetAllocationPieProps {
    data: {
        value: number;
        name: string;
    }[];
}

export function AssetAllocationPie({ data }: AssetAllocationPieProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "item",
        },
        legend: {
            bottom: "0%",
            left: "center",
            textStyle: {
                color: isDark ? "#9ca3af" : "#374151",
            },
        },
        series: [
            {
                name: "资产分布",
                type: "pie",
                radius: ["40%", "70%"],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
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
                        fontSize: 20,
                        fontWeight: "bold",
                        color: isDark ? "#fff" : "#000",
                    },
                },
                labelLine: {
                    show: false,
                },
                data: data,
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />;
}

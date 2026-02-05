"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface AssetTrendChartProps {
    data: {
        dates: string[];
        values: number[];
    };
    isPercentage?: boolean;
}

export function AssetTrendChart({ data, isPercentage = false }: AssetTrendChartProps) {
    const { theme } = useTheme();

    // 判断是否为暗黑模式以调整图表颜色
    const isDark = theme === "dark";

    interface TooltipParams {
      axisValue: string;
      value: number;
      marker: string;
      seriesName: string;
    }

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        formatter: (params: TooltipParams | TooltipParams[]) => {
          const param = Array.isArray(params) ? params[0] : params;
          const date = param.axisValue;
          const value = param.value;
          return `${date}<br/>${param.marker} ${param.seriesName}: ${value}${isPercentage ? "%" : ""}`;
        },
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          boundaryGap: false,
          data: data.dates,
          axisLine: {
            lineStyle: {
              color: isDark ? "#4b5563" : "#e5e7eb",
            },
          },
          axisLabel: {
            color: isDark ? "#9ca3af" : "#6b7280",
          },
        },
      ],
      yAxis: [
        {
          type: "value",
          axisLabel: {
            color: isDark ? "#9ca3af" : "#6b7280",
            formatter: (value: number) => {
              return `${value}${isPercentage ? "%" : ""}`;
            },
          },
          splitLine: {
            lineStyle: {
              color: isDark ? "#374151" : "#f3f4f6",
            },
          },
        },
      ],
      series: [
        {
          name: "总资产",
          type: "line",
          stack: "Total",
          smooth: true,
          lineStyle: {
            width: 3,
            color: "#3b82f6", // Blue-500
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(59, 130, 246, 0.5)", // Blue-500 with opacity
                },
                {
                  offset: 1,
                  color: "rgba(59, 130, 246, 0.01)",
                },
              ],
            },
          },
          emphasis: {
            focus: "series",
          },
          data: data.values,
        },
      ],
    };

    return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />;
}

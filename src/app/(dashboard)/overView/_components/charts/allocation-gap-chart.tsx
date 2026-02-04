"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine, Cell } from 'recharts';

interface Props {
    data: {
        name: string;
        actual: number;
        target: number;
        color: string;
    }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border text-popover-foreground p-2 rounded shadow-md text-xs">
                <p className="font-bold mb-1">{label}</p>
                <p className="text-blue-500">Actual: {payload[0].value}%</p>
                <p className="text-gray-500">Target: {payload[1].value}%</p>
                <p className={`font-bold mt-1 ${payload[0].value < payload[1].value ? "text-red-500" : "text-green-500"}`}>
                    Gap: {(payload[0].value - payload[1].value).toFixed(1)}%
                </p>
            </div>
        );
    }
    return null;
};

export function AllocationGapChart({ data }: Props) {
    // Transform for easier dual bar display
    const chartData = data.map(d => ({
        ...d,
        gap: d.actual - d.target
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar name="Actual %" dataKey="actual" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} />
                    ))}
                </Bar>
                <Bar name="Target %" dataKey="target" fill="#e5e7eb" barSize={10} radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

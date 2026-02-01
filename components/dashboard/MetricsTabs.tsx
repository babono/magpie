"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import type { MetricWithDelta } from "@/types";

interface MetricsTabsProps {
    metrics: MetricWithDelta[];
}

export function MetricsTabs({ metrics }: MetricsTabsProps) {
    const [activeTab, setActiveTab] = useState(0);
    const activeMetric = metrics[activeTab];

    const formatValue = (value: number, format: string) => {
        switch (format) {
            case "currency":
                return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case "rating":
                return value.toFixed(1);
            default:
                return value.toLocaleString("en-US");
        }
    };

    const formatTooltipValue = (value: number) => {
        switch (activeMetric.format) {
            case "currency":
                return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case "rating":
                return value.toFixed(1);
            default:
                return value.toLocaleString("en-US");
        }
    };

    return (
        <Card className="overflow-hidden py-0 pb-6">
            {/* Tab Headers */}
            <div className="flex border-b">
                {metrics.map((metric, index) => (
                    <button
                        key={metric.key}
                        onClick={() => setActiveTab(index)}
                        className={`
                            flex-1 px-4 py-4 text-left transition-colors relative
                            hover:bg-muted/50
                            ${index !== metrics.length - 1 ? "border-r" : ""}
                            ${activeTab === index ? "bg-muted/30" : ""}
                        `}
                    >
                        {/* Active indicator */}
                        {activeTab === index && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#F6C95F' }} />
                        )}

                        <div className="text-sm text-muted-foreground mb-1">
                            {metric.label}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">
                                {formatValue(metric.value, metric.format)}
                            </span>
                            {metric.delta !== 0 && (
                                <DeltaBadge delta={metric.delta} />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Chart Content */}
            <CardContent className="pt-6">
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={activeMetric.chartData}
                            margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                                width={60}
                                tickFormatter={(value) => {
                                    if (activeMetric.format === "currency") {
                                        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                                        return `$${value}`;
                                    }
                                    return value;
                                }}
                            />
                            <Tooltip
                                formatter={(value) => [
                                    formatTooltipValue(Number(value) || 0),
                                    activeMetric.label,
                                ]}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                }}
                                labelStyle={{ color: "#4C4943" }}
                                itemStyle={{ color: "#4C4943" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#F6C95F"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "#F6C95F" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

function DeltaBadge({ delta }: { delta: number }) {
    const isPositive = delta > 0;
    const isNegative = delta < 0;

    return (
        <span
            className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${isPositive ? "bg-green-100 text-green-700" : ""}
                ${isNegative ? "bg-red-100 text-red-700" : ""}
                ${!isPositive && !isNegative ? "bg-gray-100 text-gray-600" : ""}
            `}
        >
            {isPositive ? "+" : ""}
            {delta.toFixed(0)}%
        </span>
    );
}

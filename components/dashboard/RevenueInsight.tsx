"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
    Tooltip,
} from "recharts";
import type { RevenueInsightData, RevenueBreakdownItem } from "@/types";

interface Props {
    data: RevenueInsightData;
}

type TabType = "category" | "product";

export function RevenueInsight({ data }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>("category");
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const breakdown = activeTab === "category" ? data.byCategory : data.byProduct;
    const dailyData = activeTab === "category" ? data.dailyByCategory : data.dailyByProduct;
    const colors = activeTab === "category" ? data.categoryColors : data.productColors;

    // Get hovered date from index
    const hoveredDate = activeIndex !== null && dailyData[activeIndex]
        ? dailyData[activeIndex].date as string
        : null;

    // Calculate breakdown for display using useCallback
    const getDisplayBreakdown = useCallback((): RevenueBreakdownItem[] => {
        if (activeIndex === null || !dailyData[activeIndex]) {
            return breakdown;
        }

        const dayData = dailyData[activeIndex];
        const dayItems: RevenueBreakdownItem[] = [];
        let dayTotal = 0;

        // First pass: calculate total
        for (const item of breakdown) {
            const value = Number(dayData[item.name]) || 0;
            dayTotal += value;
        }

        // Second pass: build items with percentages
        for (const item of breakdown) {
            const value = Number(dayData[item.name]) || 0;
            dayItems.push({
                name: item.name,
                value,
                percentage: dayTotal > 0 ? (value / dayTotal) * 100 : 0,
                color: item.color,
            });
        }

        return dayItems;
    }, [activeIndex, dailyData, breakdown]);

    const displayBreakdown = getDisplayBreakdown();

    // Calculate display total for header
    const displayTotal = activeIndex === null
        ? data.totalRevenue
        : displayBreakdown.reduce((sum, item) => sum + item.value, 0);

    const formatCurrency = (value: number) => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}k`;
        }
        return `$${value.toFixed(0)}`;
    };

    // Handle bar cell hover events
    const handleCellMouseEnter = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    const handleChartMouseLeave = useCallback(() => {
        setActiveIndex(null);
    }, []);

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">Revenue</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {hoveredDate
                                ? `Revenue for ${hoveredDate}`
                                : "Revenue breakdown for the last 7 days"
                            }
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">
                            ${displayTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => {
                            setActiveTab("category");
                            setActiveIndex(null);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "category"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Category
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("product");
                            setActiveIndex(null);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "product"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Product
                    </button>
                </div>

                {/* Stacked Bar Chart */}
                <div className="h-[280px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={dailyData}
                            margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                            onMouseLeave={handleChartMouseLeave}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#4C4943" }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#4C4943" }}
                                tickFormatter={formatCurrency}
                                width={60}
                            />

                            {/* Tooltip with cursor for grey background highlight */}
                            <Tooltip
                                cursor={{ fill: "rgba(156, 163, 175, 0.2)" }}
                                content={() => null}
                                wrapperStyle={{ display: "none" }}
                            />

                            {breakdown.map((item) => (
                                <Bar
                                    key={item.name}
                                    dataKey={item.name}
                                    stackId="stack"
                                    fill={colors[item.name]}
                                    radius={[0, 0, 0, 0]}
                                >
                                    {dailyData.map((_, index) => (
                                        <Cell
                                            key={`cell-${item.name}-${index}`}
                                            fill={colors[item.name]}
                                            cursor="pointer"
                                            onMouseEnter={() => handleCellMouseEnter(index)}
                                        />
                                    ))}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Breakdown Table - using activeIndex in key forces full re-render */}
                <div className="space-y-3" key={String(activeIndex)}>
                    {displayBreakdown.map((item, idx) => (
                        <div
                            key={`row-${idx}`}
                            className="flex items-center justify-between py-2 border-b border-muted last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-muted-foreground">
                                    ${item.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm font-medium w-16 text-right">
                                    {item.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

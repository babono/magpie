"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface Props {
    data: { name: string; value: number }[];
}

const COLORS = ["#F6C95F", "#EDB85A", "#F8DE97", "#F8D978"];

export function StatusDistribution({ data }: Props) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={{ stroke: "#4C4943" }}
                                label={({ name, percent, x, y }: { name?: string; percent?: number; x?: number; y?: number }) => (
                                    <text x={x} y={y} fill="#4C4943" textAnchor="middle" dominantBaseline="text-after-edge" fontSize={12}>
                                        {`${name || 'Unknown'} ${((percent || 0) * 100).toFixed(0)}%`}
                                    </text>
                                )}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "2px 4px",
                                    fontSize: "12px",
                                }}
                                itemStyle={{ color: "#4C4943" }}
                            />
                            <Legend
                                formatter={(value) => <span style={{ color: "#4C4943", fontSize: "12px" }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

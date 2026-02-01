"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
    data: { name: string; value: number }[];
}

export function CategoryDistribution({ data }: Props) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Products by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#4C4943" }} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} tick={{ fill: "#4C4943" }} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                }}
                                itemStyle={{ color: "#4C4943" }}
                                labelStyle={{ color: "#4C4943" }}
                            />
                            <Bar dataKey="value" fill="#F6C95F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

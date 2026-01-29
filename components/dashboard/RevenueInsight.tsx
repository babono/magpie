"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface Props {
    data: { name: string; value: number }[];
}

export function RevenueInsight({ data }: Props) {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Revenue by Category (Business Insight)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

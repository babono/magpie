// API Types (from external API)
export type ApiProduct = {
    product_id: number;
    name: string;
    description: string;
    price: number;
    unit: string;
    image: string;
    discount: number;
    availability: boolean;
    brand: string;
    category: string;
    rating: number;
};

export type ApiOrder = {
    order_id: number;
    user_id: number;
    items: { product_id: number; quantity: number }[];
    total_price: number;
    status: string;
};

// Order Status enum (mirrors Prisma enum)
export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

// Dashboard Types
export interface DashboardMetrics {
    revenue: number;
    totalOrders: number;
    avgOrderValue: number;
    avgRating: number;
}

export interface RecentOrder {
    id: string;
    customer: string;
    status: string;
    totalAmount: import("@prisma/client").Prisma.Decimal;
    amount: number;
    date: string;
    items: number;
}

export interface TopProduct {
    id: string;
    name: string;
    category: string;
    price: number;
    rating: number;
    image: string | null;
}

export interface StatusDistribution {
    name: string;
    value: number;
}

export interface CategoryDistribution {
    name: string;
    value: number;
}

// Revenue Insight Types
export interface RevenueBreakdownItem {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

export interface RevenueInsightData {
    totalRevenue: number;
    byCategory: RevenueBreakdownItem[];
    byProduct: RevenueBreakdownItem[];
    dailyByCategory: { date: string; [key: string]: number | string }[];
    dailyByProduct: { date: string; [key: string]: number | string }[];
    categoryColors: Record<string, string>;
    productColors: Record<string, string>;
}

// Metrics with Time Series Types
export interface ChartDataPoint {
    date: string;
    value: number;
}

export type MetricKey = "revenue" | "orders" | "avgOrderValue" | "avgRating";
export type MetricFormat = "currency" | "number" | "rating";

export interface MetricWithDelta {
    key: MetricKey;
    label: string;
    value: number;
    previousValue: number;
    delta: number; // percentage change
    format: MetricFormat;
    chartData: ChartDataPoint[];
}

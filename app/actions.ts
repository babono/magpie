"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
    const [totalRevenue, totalOrders, productRatingStats] = await Promise.all([
        prisma.order.aggregate({
            _sum: { totalAmount: true },
        }),
        prisma.order.count(),
        // @ts-ignore: Rating exists in schema but client might be outdated
        prisma.product.aggregate({
            _avg: { rating: true },
        }),
    ]);

    const revenue = totalRevenue._sum.totalAmount?.toNumber() || 0;
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
    // @ts-ignore: productRatingStats type might be inferred incorrectly without generate
    const avgRating = productRatingStats._avg?.rating?.toNumber() || 0;

    return {
        revenue,
        totalOrders,
        avgOrderValue,
        avgRating,
    };
}

export async function getRecentOrders() {
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            orderItems: {
                include: { product: true },
            },
        },
    });

    return orders.map((order) => ({
        id: order.id.toString(), // Internal Integer ID
        // @ts-ignore: customerId exists in schema
        customer: (order as any).customerId || "Guest",
        status: order.status,
        totalAmount: order.totalAmount, // Keep original
        amount: order.totalAmount.toNumber(),
        date: order.createdAt.toISOString(),
        items: order.orderItems.length,
    }));
}

export async function getTopProducts() {
    const products = await prisma.product.findMany({
        take: 5,
        orderBy: { price: "desc" }, // Requirement: "Highest priced items"
    });

    return products.map((p) => ({
        id: p.externalId,
        name: p.name,
        category: p.category,
        price: p.price.toNumber(),
        // @ts-ignore: rating exists in schema
        rating: (p as any).rating?.toNumber() || 0,
        // @ts-ignore: image exists in schema
        image: (p as any).image,
    }));
}

export async function getOrdersByStatus() {
    const statusCounts = await prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
    });

    return statusCounts.map((s) => ({
        name: s.status,
        value: s._count.id,
    }));
}

export async function getProductsByCategory() {
    const categoryCounts = await prisma.product.groupBy({
        by: ["category"],
        _count: { id: true },
    });

    return categoryCounts.map((c) => ({
        name: c.category,
        value: c._count.id,
    }));
}

// Custom Insight: Revenue by Category
export async function getRevenueByCategory() {
    // Prisma doesn't support complex joins in groupBy easily, so we might need raw query or JS processing.
    // For small dataset, JS processing is fine and safer/easier to read.

    const orders = await prisma.orderItem.findMany({
        include: {
            product: true,
            order: true, // we might need order status to filter only completed orders? 
            // Prompt doesn't specify logic, but usually revenue is from non-cancelled orders.
        }
    });

    const revenueMap: Record<string, number> = {};

    orders.forEach((item) => {
        // Basic filter: ignore cancelled
        if ((item.order.status as string) === 'Cancelled') return;

        const cat = item.product.category;
        const amount = item.unitPrice.toNumber() * item.quantity;

        if (!revenueMap[cat]) revenueMap[cat] = 0;
        revenueMap[cat] += amount;
    });

    return Object.entries(revenueMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Descending
}

export async function getLastSyncTime() {
    // Check both Orders and Products for the latest sync time
    // We use updatedAt to track the last time the sync job touched a record
    const [lastOrder, lastProduct] = await Promise.all([
        prisma.order.findFirst({
            orderBy: { updatedAt: "desc" },
            select: { updatedAt: true },
        }),
        prisma.product.findFirst({
            orderBy: { updatedAt: "desc" },
            select: { updatedAt: true },
        }),
    ]);

    const orderTime = lastOrder?.updatedAt?.getTime() || 0;
    const productTime = lastProduct?.updatedAt?.getTime() || 0;

    // Return the latest of the two, or null if neither exists
    const latestTime = Math.max(orderTime, productTime);

    return latestTime > 0 ? new Date(latestTime) : null;
}

// Metric types for the analytics tabs
export interface MetricWithDelta {
    key: 'revenue' | 'orders' | 'avgOrderValue' | 'avgRating';
    label: string;
    value: number;
    previousValue: number;
    delta: number; // percentage change
    format: 'currency' | 'number' | 'rating';
    chartData: { date: string; value: number }[];
}

export async function getMetricsWithTimeSeries(): Promise<MetricWithDelta[]> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get orders from last 14 days for comparison
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: fourteenDaysAgo },
            status: { not: 'Cancelled' }
        },
        select: {
            createdAt: true,
            totalAmount: true,
        },
        orderBy: { createdAt: 'asc' }
    });

    // Get product ratings (static for now, as ratings don't have timestamps)
    const productStats = await prisma.product.aggregate({
        _avg: { rating: true },
        _count: { id: true }
    });
    const avgRating = productStats._avg?.rating?.toNumber() || 0;

    // Group orders by day
    const dailyData: Record<string, { revenue: number; orderCount: number }> = {};

    // Initialize all 14 days with zeros
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        dailyData[dateKey] = { revenue: 0, orderCount: 0 };
    }

    // Populate with actual data
    orders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
            dailyData[dateKey].revenue += order.totalAmount.toNumber();
            dailyData[dateKey].orderCount += 1;
        }
    });

    // Split into current (last 7 days) and previous (prior 7 days)
    const sortedDates = Object.keys(dailyData).sort();
    const previousPeriodDates = sortedDates.slice(0, 7);
    const currentPeriodDates = sortedDates.slice(7, 14);

    // Calculate totals for each period
    let currentRevenue = 0, previousRevenue = 0;
    let currentOrders = 0, previousOrders = 0;

    previousPeriodDates.forEach(date => {
        previousRevenue += dailyData[date].revenue;
        previousOrders += dailyData[date].orderCount;
    });

    currentPeriodDates.forEach(date => {
        currentRevenue += dailyData[date].revenue;
        currentOrders += dailyData[date].orderCount;
    });

    const currentAvgOrder = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAvgOrder = previousOrders > 0 ? previousRevenue / previousOrders : 0;

    // Calculate deltas (percentage change)
    const calcDelta = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Build chart data (last 7 days only)
    const revenueChartData = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: dailyData[date].revenue
    }));

    const ordersChartData = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: dailyData[date].orderCount
    }));

    const avgOrderChartData = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: dailyData[date].orderCount > 0
            ? dailyData[date].revenue / dailyData[date].orderCount
            : 0
    }));

    // Rating chart is flat (we don't have historical rating data)
    const ratingChartData = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: avgRating
    }));

    return [
        {
            key: 'revenue',
            label: 'Total Revenue',
            value: currentRevenue,
            previousValue: previousRevenue,
            delta: calcDelta(currentRevenue, previousRevenue),
            format: 'currency',
            chartData: revenueChartData
        },
        {
            key: 'orders',
            label: 'Total Orders',
            value: currentOrders,
            previousValue: previousOrders,
            delta: calcDelta(currentOrders, previousOrders),
            format: 'number',
            chartData: ordersChartData
        },
        {
            key: 'avgOrderValue',
            label: 'Avg. Order Value',
            value: currentAvgOrder,
            previousValue: previousAvgOrder,
            delta: calcDelta(currentAvgOrder, previousAvgOrder),
            format: 'currency',
            chartData: avgOrderChartData
        },
        {
            key: 'avgRating',
            label: 'Avg. Product Rating',
            value: avgRating,
            previousValue: avgRating, // No historical data
            delta: 0,
            format: 'rating',
            chartData: ratingChartData
        }
    ];
}

function formatChartDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

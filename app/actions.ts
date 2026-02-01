"use server";

import { prisma } from "@/lib/prisma";
import type {
    DashboardMetrics,
    RecentOrder,
    TopProduct,
    StatusDistribution,
    CategoryDistribution,
    RevenueBreakdownItem,
    RevenueInsightData,
    MetricWithDelta,
    ChartDataPoint,
} from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const [totalRevenue, totalOrders, productRatingStats] = await Promise.all([
        prisma.order.aggregate({
            _sum: { totalAmount: true },
        }),
        prisma.order.count(),
        prisma.product.aggregate({
            _avg: { rating: true },
        }),
    ]);

    const revenue = totalRevenue._sum.totalAmount?.toNumber() || 0;
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
    const avgRating = productRatingStats._avg?.rating?.toNumber() || 0;

    return {
        revenue,
        totalOrders,
        avgOrderValue,
        avgRating,
    };
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { id: "desc" },
        include: {
            orderItems: {
                include: { product: true },
            },
        },
    });

    return orders.map((order) => ({
        id: order.id.toString(),
        customer: order.customerId || "Guest",
        status: order.status,
        totalAmount: order.totalAmount,
        amount: order.totalAmount.toNumber(),
        date: order.createdAt.toISOString(),
        items: order.orderItems.length,
    }));
}

export async function getTopProducts(): Promise<TopProduct[]> {
    const products = await prisma.product.findMany({
        take: 5,
        orderBy: { price: "desc" },
    });

    return products.map((p) => ({
        id: p.externalId,
        name: p.name,
        category: p.category,
        price: p.price.toNumber(),
        rating: p.rating?.toNumber() || 0,
        image: p.image,
    }));
}

export async function getOrdersByStatus(): Promise<StatusDistribution[]> {
    const statusCounts = await prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
    });

    return statusCounts.map((s) => ({
        name: s.status,
        value: s._count.id,
    }));
}

export async function getProductsByCategory(): Promise<CategoryDistribution[]> {
    const categoryCounts = await prisma.product.groupBy({
        by: ["category"],
        _count: { id: true },
    });

    return categoryCounts.map((c) => ({
        name: c.category,
        value: c._count.id,
    }));
}

// Color palette for charts (golden yellow shades + complementary)
const CHART_COLORS = [
    "#F6C95F", "#EDB85A", "#F8DE97", "#F8D978",
    "#D4A853", "#C19A4B", "#B8894A", "#A67C4E",
    "#8B6F47", "#7A6244", "#6E5840", "#5D4E3A"
];

export async function getRevenueInsightData(): Promise<RevenueInsightData> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderItems = await prisma.orderItem.findMany({
        include: {
            product: true,
            order: true,
        },
        where: {
            order: {
                createdAt: { gte: sevenDaysAgo },
                status: { not: 'Cancelled' }
            }
        }
    });

    // Calculate totals by category and product
    const categoryMap: Record<string, number> = {};
    const productMap: Record<string, number> = {};
    const dailyCategoryMap: Record<string, Record<string, number>> = {};
    const dailyProductMap: Record<string, Record<string, number>> = {};
    let totalRevenue = 0;

    // Initialize days
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyCategoryMap[dateKey] = {};
        dailyProductMap[dateKey] = {};
    }

    orderItems.forEach((item) => {
        const amount = item.unitPrice.toNumber() * item.quantity;
        const category = item.product.category;
        const productName = item.product.name.length > 25
            ? item.product.name.substring(0, 25) + '...'
            : item.product.name;
        const dateKey = item.order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        totalRevenue += amount;

        // Category totals
        if (!categoryMap[category]) categoryMap[category] = 0;
        categoryMap[category] += amount;

        // Product totals
        if (!productMap[productName]) productMap[productName] = 0;
        productMap[productName] += amount;

        // Daily category
        if (dailyCategoryMap[dateKey]) {
            if (!dailyCategoryMap[dateKey][category]) dailyCategoryMap[dateKey][category] = 0;
            dailyCategoryMap[dateKey][category] += amount;
        }

        // Daily product
        if (dailyProductMap[dateKey]) {
            if (!dailyProductMap[dateKey][productName]) dailyProductMap[dateKey][productName] = 0;
            dailyProductMap[dateKey][productName] += amount;
        }
    });

    // Sort and assign colors
    const sortedCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const sortedProducts = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const categoryColors: Record<string, string> = {};
    const productColors: Record<string, string> = {};

    sortedCategories.forEach(([name], index) => {
        categoryColors[name] = CHART_COLORS[index % CHART_COLORS.length];
    });

    sortedProducts.forEach(([name], index) => {
        productColors[name] = CHART_COLORS[index % CHART_COLORS.length];
    });

    // Build breakdown arrays
    const byCategory: RevenueBreakdownItem[] = sortedCategories.map(([name, value]) => ({
        name,
        value,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
        color: categoryColors[name],
    }));

    const byProduct: RevenueBreakdownItem[] = sortedProducts.map(([name, value]) => ({
        name,
        value,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
        color: productColors[name],
    }));

    // Build daily data for stacked charts
    const dailyByCategory = Object.entries(dailyCategoryMap).map(([date, data]) => ({
        date,
        ...data,
    }));

    const dailyByProduct = Object.entries(dailyProductMap).map(([date, data]) => ({
        date,
        ...data,
    }));

    return {
        totalRevenue,
        byCategory,
        byProduct,
        dailyByCategory,
        dailyByProduct,
        categoryColors,
        productColors,
    };
}

export async function getRevenueByCategory(): Promise<{ name: string; value: number }[]> {
    // Keep for backward compatibility
    const data = await getRevenueInsightData();
    return data.byCategory.map(item => ({ name: item.name, value: item.value }));
}

export async function getLastSyncTime(): Promise<Date | null> {
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
    const revenueChartData: ChartDataPoint[] = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: dailyData[date].revenue
    }));

    const ordersChartData: ChartDataPoint[] = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: dailyData[date].orderCount
    }));

    const avgOrderChartData: ChartDataPoint[] = currentPeriodDates.map(date => ({
        date: formatChartDate(date),
        value: dailyData[date].orderCount > 0
            ? dailyData[date].revenue / dailyData[date].orderCount
            : 0
    }));

    // Rating chart is flat (we don't have historical rating data)
    const ratingChartData: ChartDataPoint[] = currentPeriodDates.map(date => ({
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

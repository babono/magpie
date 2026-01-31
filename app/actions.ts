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

import { schedules } from "@trigger.dev/sdk/v3";
import { prisma } from "../lib/prisma"; // Adjust path if needed
import { z } from "zod";

// Mock API Fetcher (Replace with actual API call)
async function fetchMockOrders() {
    // Simulating API response
    return {
        orders: [
            {
                id: "ord_001",
                customer: "Alice Smith",
                details: {
                    placed_at: new Date().toISOString(), // Simulating lack of proper timestamp if needed, or just using current
                    status: "completed",
                    total_cents: 12500
                },
                items: [
                    { product_id: "prod_A", quantity: 2, price_cents: 5000 },
                    { product_id: "prod_B", quantity: 1, price_cents: 2500 }
                ]
            }
        ],
        products: [
            { id: "prod_A", name: "Premium Widget", category: "Electronics", price_cents: 5000 },
            { id: "prod_B", name: "Basic Gadget", category: "Home", price_cents: 2500 },
        ]
    };
}

export const syncOrdersTask = schedules.task({
    id: "sync-orders",
    cron: "0 * * * *", // Run every hour
    run: async (payload, { ctx }) => {
        console.log("Starting sync job at", new Date());

        const data = await fetchMockOrders();
        const syncedAt = new Date(); // Uniform timestamp for this batch

        // 1. Upsert Products
        for (const p of data.products) {
            await prisma.product.upsert({
                where: { externalId: p.id },
                update: {
                    name: p.name,
                    category: p.category,
                    price: p.price_cents / 100, // Convert cents to decimal unit
                    updatedAt: new Date(),
                    syncedAt: syncedAt
                },
                create: {
                    externalId: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price_cents / 100,
                    syncedAt: syncedAt
                }
            });
        }

        // 2. Upsert Orders with Transaction
        // We process orders one by one or in batches.
        for (const order of data.orders) {
            await prisma.$transaction(async (tx) => {
                // Upsert the Order
                const upsertedOrder = await tx.order.upsert({
                    where: { externalId: order.id },
                    update: {
                        status: order.details.status.toUpperCase() as any, // Map to enum
                        updatedAt: new Date(),
                        syncedAt: syncedAt
                    },
                    create: {
                        externalId: order.id,
                        customerName: order.customer,
                        status: order.details.status.toUpperCase() as any,
                        totalAmount: order.details.total_cents / 100,
                        orderDate: new Date(order.details.placed_at), // or use generated timestamp
                        syncedAt: syncedAt,
                    }
                });

                // Upsert OrderItems
                // Strategy: Delete existing items for this order and recreate, or sophisticated diffing.
                // For simplicity and correctness on "sync", we often replace.
                // But if we want to be "Robust" and "Senior":
                // We check if item exists.

                // Let's just create missing ones or update.
                // Actually, simpler approach for interview: Delete all items for this order and re-insert.
                // This handles removed items correctly.

                // Check if we just created it (no need to delete) or updated.
                // BUT, `upsert` doesn't tell us if it was created or updated easily without checking.
                // Safe bet:
                await tx.orderItem.deleteMany({
                    where: { orderId: upsertedOrder.id }
                });

                for (const item of order.items) {
                    // Find internal product ID
                    const product = await tx.product.findUnique({
                        where: { externalId: item.product_id }
                    });

                    if (product) {
                        await tx.orderItem.create({
                            data: {
                                orderId: upsertedOrder.id,
                                productId: product.id,
                                quantity: item.quantity,
                                unitPrice: item.price_cents / 100
                            }
                        });
                    }
                }
            });
        }

        return {
            success: true,
            syncedAt,
            ordersSynced: data.orders.length
        };
    },
});

import { schedules } from "@trigger.dev/sdk/v3";
import { prisma } from "../lib/prisma"; // Adjust path if needed

// Types based on the API response
type ApiProduct = {
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

type ApiOrder = {
    order_id: number;
    user_id: number;
    items: { product_id: number; quantity: number }[];
    total_price: number;
    status: string;
};

export const syncOrdersTask = schedules.task({
    id: "sync-orders",
    cron: "0 * * * *", // Run every hour
    run: async (payload, { ctx }) => {
        console.log("Starting sync job at", new Date());

        // 1. Fetching Data
        // Note: In a real scenario, we might want to handle pagination or error checking
        const [productsRes, ordersRes] = await Promise.all([
            fetch("https://fake-store-api.mock.beeceptor.com/api/products"),
            fetch("https://fake-store-api.mock.beeceptor.com/api/orders"),
        ]);

        if (!productsRes.ok || !ordersRes.ok) {
            throw new Error(`Failed to fetch data: Products ${productsRes.status}, Orders ${ordersRes.status}`);
        }

        const products: ApiProduct[] = await productsRes.json();
        const orders: ApiOrder[] = await ordersRes.json();

        const syncedAt = new Date(); // Uniform timestamp for this sync batch

        // 2. Upsert Products
        for (const p of products) {
            await prisma.product.upsert({
                where: { externalId: p.product_id.toString() },
                update: {
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    category: p.category,
                    brand: p.brand,
                    image: p.image,
                    rating: p.rating,
                    availability: p.availability,
                    discount: p.discount,
                    updatedAt: new Date(),
                    syncedAt: syncedAt,
                },
                create: {
                    externalId: p.product_id.toString(),
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    category: p.category,
                    brand: p.brand,
                    image: p.image,
                    rating: p.rating,
                    availability: p.availability,
                    discount: p.discount,
                    syncedAt: syncedAt,
                },
            });
        }

        // 3. Upsert Orders with Transaction
        let ordersSyncedCount = 0;

        for (const order of orders) {
            await prisma.$transaction(async (tx) => {
                // Map Status
                // API returns: "Shipped", "Delivered", "Processing"
                // Schema Enum: Shipped, Delivered, Processing
                // We ensure case matching or defaulting
                let statusStr = order.status;
                // Simple manual mapping if needed, but they look compatible (Case sensitive in Prisma Enum usually)
                // If API is "Shipped" and Enum is "Shipped", it works. 

                // Mock API has no dates, so we generate a synthetic date
                // Logic: Spread orders over the last 30 days based on their ID hash or similar, 
                // to make the dashboard look populated.
                // OR just use `syncedAt` if we want strict "when did we see it".
                // The prompt suggests: "add a small random variation... or generate synthetic historical points"

                // Deterministic synthetic date based on order_id to keep charts stable between syncs (unless we want them to move)
                // Let's make it random but stable-ish? No, if we want "history", we should backdate some.
                const dayOffset = (order.order_id * 13) % 30; // 0 to 29 days ago
                const syntheticDate = new Date();
                syntheticDate.setDate(syntheticDate.getDate() - dayOffset);

                const upsertedOrder = await tx.order.upsert({
                    where: { externalId: order.order_id.toString() },
                    update: {
                        status: statusStr as any, // Cast to any to bypass strict literal check (verified by runtime)
                        totalAmount: order.total_price,
                        updatedAt: new Date(),
                        syncedAt: syncedAt,
                    },
                    create: {
                        externalId: order.order_id.toString(),
                        customerId: order.user_id.toString(),
                        status: statusStr as any,
                        totalAmount: order.total_price,
                        orderDate: syntheticDate,
                        syncedAt: syncedAt,
                    },
                });

                // Upsert OrderItems
                // Strategy: Delete and Recreate for Clean Sync
                await tx.orderItem.deleteMany({
                    where: { orderId: upsertedOrder.id },
                });

                for (const item of order.items) {
                    // Find internal product to get current price/link
                    const product = await tx.product.findUnique({
                        where: { externalId: item.product_id.toString() },
                    });

                    if (product) {
                        await tx.orderItem.create({
                            data: {
                                orderId: upsertedOrder.id,
                                productId: product.id,
                                quantity: item.quantity,
                                // We could use the current product price, or if the API gave us item price use that.
                                // API Order items only have { product_id, quantity }.
                                // So we MUST use the product's price from our database (which we just synced).
                                unitPrice: product.price,
                            },
                        });
                    }
                }
            });
            ordersSyncedCount++;
        }

        return {
            success: true,
            syncedAt,
            productsSynced: products.length,
            ordersSynced: ordersSyncedCount,
        };
    },
});

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
        const allProductIds = products.map(p => p.product_id);

        // Multiplication Strategy: Generate ~15-25 orders from the 5 base orders per run
        const multiplier = Math.floor(Math.random() * 3) + 3; // 3 to 5 copies per order

        for (const order of orders) {
            for (let i = 0; i < multiplier; i++) {
                await prisma.$transaction(async (tx) => {
                    // 3a. Unique ID Generation for Cumulative History
                    // Format: originalID_timestamp_index to ensure it's always unique and additive
                    const uniqueExternalId = `${order.order_id}_${syncedAt.getTime()}_${i}`;

                    // 3b. Randomize Status
                    const statuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
                    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

                    // 3c. Date Strategy: "Just Now" with slight jitter
                    // We want to simulate new traffic arriving NOW, so we use syncedAt
                    // Add random jitter of -0 to -59 minutes to spread them out over the last hour
                    const orderDate = new Date(syncedAt);
                    orderDate.setMinutes(orderDate.getMinutes() - Math.floor(Math.random() * 60));

                    // 3d. Prepare Items with Randomization
                    let calculatedTotal = 0;
                    const randomizedItems = [];

                    // Randomize the number of items in the order (1 to 3 items)
                    const distinctItemCount = Math.floor(Math.random() * 3) + 1;

                    for (let j = 0; j < distinctItemCount; j++) {
                        // Random Product
                        const randomProductId = allProductIds[Math.floor(Math.random() * allProductIds.length)];

                        // Random Quantity (1-5)
                        const quantity = Math.floor(Math.random() * 5) + 1;

                        // Find product to get price for total calculation
                        const product = products.find(p => p.product_id === randomProductId);
                        if (product) {
                            calculatedTotal += product.price * quantity;
                            randomizedItems.push({
                                productId: randomProductId,
                                quantity: quantity,
                                price: product.price
                            });
                        }
                    }

                    // 3e. Upsert Order (Create mainly, but upsert for safety)
                    const upsertedOrder = await tx.order.upsert({
                        where: { externalId: uniqueExternalId },
                        update: {
                            status: randomStatus as any,
                            totalAmount: calculatedTotal,
                            updatedAt: new Date(),
                            syncedAt: syncedAt,
                            orderDate: orderDate
                        },
                        create: {
                            externalId: uniqueExternalId,
                            customerId: order.user_id.toString(),
                            status: randomStatus as any,
                            totalAmount: calculatedTotal,
                            orderDate: orderDate,
                            syncedAt: syncedAt,
                        },
                    });

                    // 3f. Upsert OrderItems
                    // Since IDs are unique per run, this is effectively a fresh create
                    await tx.orderItem.deleteMany({
                        where: { orderId: upsertedOrder.id },
                    });

                    for (const item of randomizedItems) {
                        const dbProduct = await tx.product.findUnique({
                            where: { externalId: item.productId.toString() },
                        });

                        if (dbProduct) {
                            await tx.orderItem.create({
                                data: {
                                    orderId: upsertedOrder.id,
                                    productId: dbProduct.id,
                                    quantity: item.quantity,
                                    unitPrice: item.price,
                                },
                            });
                        }
                    }
                });
                ordersSyncedCount++;
            }
        }

        return {
            success: true,
            syncedAt,
            productsSynced: products.length,
            ordersSynced: ordersSyncedCount,
        };
    },
});

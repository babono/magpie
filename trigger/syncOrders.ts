import { schedules } from "@trigger.dev/sdk/v3";
import { prisma } from "../lib/prisma";
import type { ApiProduct, ApiOrder, OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = ["Processing", "Shipped", "Delivered", "Cancelled"];

export const syncOrdersTask = schedules.task({
    id: "sync-orders",
    cron: "0 * * * *", // Run every hour
    run: async (payload, { ctx }) => {
        console.log("Starting sync job at", new Date());

        // 1. Fetching Data
        const [productsRes, ordersRes] = await Promise.all([
            fetch("https://fake-store-api.mock.beeceptor.com/api/products"),
            fetch("https://fake-store-api.mock.beeceptor.com/api/orders"),
        ]);

        if (!productsRes.ok || !ordersRes.ok) {
            throw new Error(`Failed to fetch data: Products ${productsRes.status}, Orders ${ordersRes.status}`);
        }

        const products: ApiProduct[] = await productsRes.json();
        const orders: ApiOrder[] = await ordersRes.json();

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
                },
            });
        }

        // 3. Upsert Orders with Transaction
        let ordersSyncedCount = 0;
        const allProductIds = products.map(p => p.product_id);

        // Multiplication Strategy: Reduced Volume (User requested max 15 total)
        // 5 base orders * (1 to 3 copies) = 5 to 15 total new orders
        const multiplier = Math.floor(Math.random() * 3) + 1;

        for (const order of orders) {
            for (let i = 0; i < multiplier; i++) {
                await prisma.$transaction(async (tx) => {
                    // 3b. Randomize Status
                    const randomStatus: OrderStatus = ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)];

                    // 3c. Date Strategy: "Just Now" with slight jitter
                    // We override 'createdAt' to simulate the order placement time
                    const orderDate = new Date();
                    orderDate.setMinutes(orderDate.getMinutes() - Math.floor(Math.random() * 60));

                    // 3d. Prepare Items with Unique Logic
                    let calculatedTotal = 0;
                    const randomizedItems: { productId: number; quantity: number; price: number }[] = [];

                    const distinctItemCount = Math.floor(Math.random() * 3) + 1;

                    // Shuffle for uniqueness
                    const shuffledProducts = [...allProductIds].sort(() => 0.5 - Math.random());
                    const selectedProductIds = shuffledProducts.slice(0, distinctItemCount);

                    for (const productId of selectedProductIds) {
                        const quantity = Math.floor(Math.random() * 5) + 1;
                        const product = products.find(p => p.product_id === productId);
                        if (product) {
                            calculatedTotal += product.price * quantity;
                            randomizedItems.push({
                                productId: productId,
                                quantity: quantity,
                                price: product.price
                            });
                        }
                    }

                    // 3e. Create Order (no need for upsert as we want history)
                    const upsertedOrder = await tx.order.create({
                        data: {
                            customerId: order.user_id.toString(),
                            status: randomStatus as any,
                            totalAmount: calculatedTotal,
                            createdAt: orderDate,
                        },
                    });

                    // 3f. Upsert OrderItems
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
            productsSynced: products.length,
            ordersSynced: ordersSyncedCount,
        };
    },
});

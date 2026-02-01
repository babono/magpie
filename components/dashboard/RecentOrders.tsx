import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    orders: {
        id: string;
        customer: string;
        status: string;
        amount: number;
        date: string;
        items: number;
    }[];
}

const COLORS = ["#F6C95F", "#EDB85A", "#F8DE97", "#F8D978"];

function getStatusColor(status: string): string {
    // Simple hash-like selection to ensure consistent color for same status
    // or just simplified mapping based on likely statuses if we knew them.
    // Given the prompt asked for "conditional based on the value mapping with these colors",
    // and we see "Delivered", "Shipped" in the original code, we can map them.
    // However, sticking to a round-robin or deterministic assignment from the array is safer if statuses vary.
    // Let's use a simple deterministic mapping based on string length or first char code to pick a color
    const index = status.length % COLORS.length;
    return COLORS[index];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function RecentOrders({ orders }: Props) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-sm">
                                    #{order.id}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {order.customer}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-black/80"
                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                    >
                                        {order.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    {order.items}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(order.date)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatTime(order.date)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ${order.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
                                    <Badge variant={
                                        order.status === 'Delivered' ? 'default' :
                                            order.status === 'Shipped' ? 'secondary' : 'outline'
                                    }>
                                        {order.status}
                                    </Badge>
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

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

export function RecentOrders({ orders }: Props) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <div className="font-medium">{order.customer}</div>
                                    <div className="text-xs text-muted-foreground">{order.id.slice(0, 8)}...</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.status === 'Delivered' ? 'default' :
                                            order.status === 'Shipped' ? 'secondary' : 'outline'
                                    }>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">${order.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Props {
    products: {
        id: string;
        name: string;
        category: string;
        price: number;
        rating: number;
        image?: string;
    }[];
}

export function TopProducts({ products }: Props) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Top Products (Highest Price)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16 text-center">#</TableHead>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Rating</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product, index) => (
                            <TableRow key={product.id}>
                                <TableCell className="text-center font-bold text-muted-foreground">
                                    {index + 1}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {product.id}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {product.name}
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                                        {product.category}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-1">
                                        <Star className="h-4 w-4 fill-[#F6C95F] text-[#F6C95F]" />
                                        <span className="text-sm">{product.rating.toFixed(1)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ${product.price.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

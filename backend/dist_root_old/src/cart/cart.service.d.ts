import { PrismaService } from '../prisma/prisma.service';
import { CartPreviewDto } from './dto/cart-preview.dto';
export declare class CartService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    preview(dto: CartPreviewDto): Promise<{
        items: {
            carpet: {
                category: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client-runtime-utils").Decimal;
                size: string;
                material: string;
                description: string | null;
                image: string | null;
                categoryId: string;
            };
            quantity: number;
            unitPrice: number;
            subtotal: number;
        }[];
        total: number;
    }>;
}

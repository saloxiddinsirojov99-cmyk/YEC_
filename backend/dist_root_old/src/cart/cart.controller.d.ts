import { CartPreviewDto } from './dto/cart-preview.dto';
import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
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

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(customerId: string, dto: CreateOrderDto): Promise<{
        items: ({
            carpet: {
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: import("@prisma/client-runtime-utils").Decimal;
            quantity: number;
            carpetId: string;
            orderId: string;
        })[];
        customer: {
            name: string;
            id: string;
            email: string;
            phone: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerName: string;
        address: string;
        comment: string | null;
    }>;
    findMy(customerId: string, query: OrderQueryDto): Promise<{
        items: ({
            items: ({
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
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client-runtime-utils").Decimal;
                quantity: number;
                carpetId: string;
                orderId: string;
            })[];
            customer: {
                name: string;
                id: string;
                email: string;
                phone: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            customerName: string;
            address: string;
            comment: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findAll(query: OrderQueryDto): Promise<{
        items: ({
            items: ({
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
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client-runtime-utils").Decimal;
                quantity: number;
                carpetId: string;
                orderId: string;
            })[];
            customer: {
                name: string;
                id: string;
                email: string;
                phone: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            customerName: string;
            address: string;
            comment: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<{
        items: ({
            carpet: {
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: import("@prisma/client-runtime-utils").Decimal;
            quantity: number;
            carpetId: string;
            orderId: string;
        })[];
        customer: {
            name: string;
            id: string;
            email: string;
            phone: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerName: string;
        address: string;
        comment: string | null;
    }>;
}

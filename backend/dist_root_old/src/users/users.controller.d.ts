import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: {
        sub: string;
    }): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        orders: ({
            items: ({
                carpet: {
                    name: string;
                    id: string;
                    price: import("@prisma/client-runtime-utils").Decimal;
                    size: string;
                    material: string;
                    image: string | null;
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
    }>;
    updateMe(user: {
        sub: string;
    }, dto: UpdateProfileDto): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(): Promise<{
        usersCount: number;
        ordersCount: number;
        carpetsCount: number;
    }>;
    findAll(): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    remove(user: {
        sub: string;
    }, id: string): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
}

import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User>;
    createCustomer(name: string, email: string, phone: string, hashedPassword: string): Promise<User>;
    createAdmin(name: string, email: string, phone: string, hashedPassword: string): Promise<User>;
    getProfile(userId: string): Promise<{
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
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
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
    remove(currentUserId: string, userId: string): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    getAdminStats(): Promise<{
        usersCount: number;
        ordersCount: number;
        carpetsCount: number;
    }>;
}

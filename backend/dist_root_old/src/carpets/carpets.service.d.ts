import { PrismaService } from '../prisma/prisma.service';
import { CreateCarpetDto } from './dto/create-carpet.dto';
import { CarpetQueryDto } from './dto/carpet-query.dto';
import { UpdateCarpetDto } from './dto/update-carpet.dto';
export declare class CarpetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCarpetDto): Promise<{
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
    }>;
    findAll(query: CarpetQueryDto): Promise<{
        items: ({
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
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateCarpetDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    private ensureCategoryExists;
}

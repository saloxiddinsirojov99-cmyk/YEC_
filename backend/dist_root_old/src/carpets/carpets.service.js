"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarpetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CarpetsService = class CarpetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        await this.ensureCategoryExists(dto.categoryId);
        return this.prisma.carpet.create({
            data: {
                ...dto,
                price: dto.price,
            },
            include: { category: true },
        });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        if (query.minPrice !== undefined &&
            query.maxPrice !== undefined &&
            query.minPrice > query.maxPrice) {
            throw new common_1.BadRequestException("Minimal narx maksimal narxdan katta bo'lmasligi kerak.");
        }
        const where = {
            name: query.search
                ? {
                    contains: query.search,
                    mode: 'insensitive',
                }
                : undefined,
            categoryId: query.categoryId,
            size: query.size,
            price: {
                gte: query.minPrice,
                lte: query.maxPrice,
            },
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.carpet.findMany({
                where,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.carpet.count({ where }),
        ]);
        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const carpet = await this.prisma.carpet.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!carpet) {
            throw new common_1.NotFoundException('Gilam topilmadi.');
        }
        return carpet;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.categoryId) {
            await this.ensureCategoryExists(dto.categoryId);
        }
        return this.prisma.carpet.update({
            where: { id },
            data: {
                ...dto,
                price: dto.price,
            },
            include: { category: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.carpet.delete({ where: { id } });
    }
    async ensureCategoryExists(categoryId) {
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategoriya topilmadi.');
        }
    }
};
exports.CarpetsService = CarpetsService;
exports.CarpetsService = CarpetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CarpetsService);
//# sourceMappingURL=carpets.service.js.map
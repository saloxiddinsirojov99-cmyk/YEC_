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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(customerId, dto) {
        const carpetIds = [...new Set(dto.items.map((item) => item.carpetId))];
        const carpets = await this.prisma.carpet.findMany({
            where: { id: { in: carpetIds } },
            select: {
                id: true,
                price: true,
            },
        });
        if (carpets.length !== carpetIds.length) {
            throw new common_1.BadRequestException("Ba'zi gilamlar topilmadi.");
        }
        const carpetPriceMap = new Map(carpets.map((carpet) => [carpet.id, carpet.price]));
        return this.prisma.order.create({
            data: {
                customerId,
                customerName: dto.customerName,
                phone: dto.phone,
                address: dto.address,
                comment: dto.comment,
                items: {
                    create: dto.items.map((item) => {
                        const price = carpetPriceMap.get(item.carpetId);
                        if (!price) {
                            throw new common_1.BadRequestException(`Gilam narxi topilmadi: ${item.carpetId}`);
                        }
                        return {
                            carpetId: item.carpetId,
                            quantity: item.quantity,
                            price,
                        };
                    }),
                },
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                items: {
                    include: {
                        carpet: true,
                    },
                },
            },
        });
    }
    async findMy(customerId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            customerId,
            status: query.status,
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    items: {
                        include: {
                            carpet: {
                                include: { category: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
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
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = { status: query.status };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    items: {
                        include: {
                            carpet: {
                                include: { category: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
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
    async updateStatus(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) {
            throw new common_1.NotFoundException('Buyurtma topilmadi.');
        }
        return this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                items: {
                    include: {
                        carpet: true,
                    },
                },
            },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map
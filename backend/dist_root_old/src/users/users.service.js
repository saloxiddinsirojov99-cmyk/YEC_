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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException("Foydalanuvchi topilmadi.");
        }
        return user;
    }
    async createCustomer(name, email, phone, hashedPassword) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException("Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.");
        }
        return this.prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: client_1.UserRole.CUSTOMER,
            },
        });
    }
    async createAdmin(name, email, phone, hashedPassword) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException("Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.");
        }
        return this.prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: client_1.UserRole.ADMIN,
            },
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        items: {
                            include: {
                                carpet: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        size: true,
                                        material: true,
                                        price: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Profil topilmadi.');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        await this.findById(userId);
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                name: dto.name,
                phone: dto.phone,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async findAll() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async remove(currentUserId, userId) {
        if (currentUserId === userId) {
            throw new common_1.BadRequestException("O'zingizni o'chira olmaysiz.");
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("Foydalanuvchi topilmadi.");
        }
        const ordersCount = await this.prisma.order.count({
            where: { customerId: userId },
        });
        if (ordersCount > 0) {
            throw new common_1.BadRequestException("Bu foydalanuvchini o'chirib bo'lmaydi, chunki unda buyurtmalar mavjud.");
        }
        return this.prisma.user.delete({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
            },
        });
    }
    async getAdminStats() {
        const [usersCount, ordersCount, carpetsCount] = await this.prisma.$transaction([
            this.prisma.user.count(),
            this.prisma.order.count(),
            this.prisma.carpet.count(),
        ]);
        return {
            usersCount,
            ordersCount,
            carpetsCount,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map
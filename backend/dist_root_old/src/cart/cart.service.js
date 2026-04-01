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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CartService = class CartService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async preview(dto) {
        const carpetIds = [...new Set(dto.items.map((item) => item.carpetId))];
        const carpets = await this.prisma.carpet.findMany({
            where: { id: { in: carpetIds } },
            include: { category: true },
        });
        if (carpets.length !== carpetIds.length) {
            throw new common_1.BadRequestException("Ba'zi gilamlar topilmadi.");
        }
        const items = dto.items.map((item) => {
            const carpet = carpets.find((c) => c.id === item.carpetId);
            if (!carpet) {
                throw new common_1.BadRequestException(`Gilam topilmadi: ${item.carpetId}`);
            }
            const unitPrice = Number(carpet.price);
            const subtotal = unitPrice * item.quantity;
            return {
                carpet,
                quantity: item.quantity,
                unitPrice,
                subtotal,
            };
        });
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        return { items, total };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map
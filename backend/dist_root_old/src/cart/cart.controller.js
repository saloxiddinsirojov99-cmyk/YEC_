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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const form_data_decorator_1 = require("../common/decorators/form-data.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const cart_preview_dto_1 = require("./dto/cart-preview.dto");
const cart_service_1 = require("./cart.service");
let CartController = class CartController {
    cartService;
    constructor(cartService) {
        this.cartService = cartService;
    }
    preview(dto) {
        return this.cartService.preview(dto);
    }
};
exports.CartController = CartController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Savatni oldindan hisoblash' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hisob-kitob muvaffaqiyatli.' }),
    (0, swagger_1.ApiBody)({ type: cart_preview_dto_1.CartPreviewDto }),
    (0, public_decorator_1.Public)(),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.Post)('preview'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cart_preview_dto_1.CartPreviewDto]),
    __metadata("design:returntype", void 0)
], CartController.prototype, "preview", null);
exports.CartController = CartController = __decorate([
    (0, swagger_1.ApiTags)('Cart'),
    (0, common_1.Controller)('cart'),
    __metadata("design:paramtypes", [cart_service_1.CartService])
], CartController);
//# sourceMappingURL=cart.controller.js.map
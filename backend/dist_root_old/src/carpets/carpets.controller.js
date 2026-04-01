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
exports.CarpetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const form_data_decorator_1 = require("../common/decorators/form-data.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const carpets_service_1 = require("./carpets.service");
const create_carpet_dto_1 = require("./dto/create-carpet.dto");
const carpet_query_dto_1 = require("./dto/carpet-query.dto");
const update_carpet_dto_1 = require("./dto/update-carpet.dto");
let CarpetsController = class CarpetsController {
    carpetsService;
    constructor(carpetsService) {
        this.carpetsService = carpetsService;
    }
    findAll(query) {
        return this.carpetsService.findAll(query);
    }
    findOne(id) {
        return this.carpetsService.findOne(id);
    }
    create(dto) {
        return this.carpetsService.create(dto);
    }
    update(id, dto) {
        return this.carpetsService.update(id, dto);
    }
    remove(id) {
        return this.carpetsService.remove(id);
    }
};
exports.CarpetsController = CarpetsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Gilamlar ro`yxati' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Gilamlar ro'yxati." }),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [carpet_query_dto_1.CarpetQueryDto]),
    __metadata("design:returntype", void 0)
], CarpetsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Bitta gilamni olish' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Gilam ma'lumoti." }),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CarpetsController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Gilam qo`shish (admin)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({ type: create_carpet_dto_1.CreateCarpetDto }),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_carpet_dto_1.CreateCarpetDto]),
    __metadata("design:returntype", void 0)
], CarpetsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Gilamni tahrirlash (admin)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({ type: update_carpet_dto_1.UpdateCarpetDto }),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_carpet_dto_1.UpdateCarpetDto]),
    __metadata("design:returntype", void 0)
], CarpetsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Gilamni o'chirish (admin)" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CarpetsController.prototype, "remove", null);
exports.CarpetsController = CarpetsController = __decorate([
    (0, swagger_1.ApiTags)('Carpets'),
    (0, common_1.Controller)('carpets'),
    __metadata("design:paramtypes", [carpets_service_1.CarpetsService])
], CarpetsController);
//# sourceMappingURL=carpets.controller.js.map
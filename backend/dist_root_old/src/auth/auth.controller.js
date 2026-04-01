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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const form_data_decorator_1 = require("../common/decorators/form-data.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const auth_service_1 = require("./auth.service");
const create_admin_dto_1 = require("./dto/create-admin.dto");
const login_dto_1 = require("./dto/login.dto");
const request_register_otp_dto_1 = require("./dto/request-register-otp.dto");
const verify_register_otp_dto_1 = require("./dto/verify-register-otp.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    requestRegisterOtp(dto) {
        return this.authService.requestRegisterOtp(dto);
    }
    register(dto) {
        return this.authService.requestRegisterOtp(dto);
    }
    verifyRegisterOtp(dto) {
        return this.authService.verifyRegisterOtp(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    createAdmin(dto) {
        return this.authService.createAdmin(dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Ro'yxatdan o'tish uchun OTP so'rash" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'OTP emailga yuborildi.' }),
    (0, swagger_1.ApiBody)({ type: request_register_otp_dto_1.RequestRegisterOtpDto }),
    (0, public_decorator_1.Public)(),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.Post)('register/request-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_register_otp_dto_1.RequestRegisterOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestRegisterOtp", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Ro'yxatdan o'tish (OTP emailga yuboriladi)" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'OTP emailga yuborildi.' }),
    (0, swagger_1.ApiBody)({ type: request_register_otp_dto_1.RequestRegisterOtpDto }),
    (0, public_decorator_1.Public)(),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_register_otp_dto_1.RequestRegisterOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "OTP bilan ro'yxatdan o'tishni yakunlash" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Ro'yxatdan o'tish yakunlandi." }),
    (0, swagger_1.ApiBody)({ type: verify_register_otp_dto_1.VerifyRegisterOtpDto }),
    (0, public_decorator_1.Public)(),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.Post)('register/verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_register_otp_dto_1.VerifyRegisterOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyRegisterOtp", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Tizimga kirish (admin/customer)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Kirish muvaffaqiyatli.' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, public_decorator_1.Public)(),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Yangi admin qo'shish (faqat admin)" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Yangi admin yaratildi.' }),
    (0, swagger_1.ApiBody)({ type: create_admin_dto_1.CreateAdminDto }),
    (0, form_data_decorator_1.FormDataRequest)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Post)('admins'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateAdminDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "createAdmin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
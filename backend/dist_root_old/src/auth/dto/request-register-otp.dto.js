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
exports.RequestRegisterOtpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RequestRegisterOtpDto {
    name;
    email;
    phone;
    password;
}
exports.RequestRegisterOtpDto = RequestRegisterOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ali Valiyev' }),
    (0, class_validator_1.IsString)({ message: "Ism matn bo'lishi kerak." }),
    (0, class_validator_1.MinLength)(2, { message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak." }),
    (0, class_validator_1.MaxLength)(100, { message: "Ism 100 ta belgidan oshmasligi kerak." }),
    __metadata("design:type", String)
], RequestRegisterOtpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'customer@yectashkent.uz' }),
    (0, class_validator_1.IsEmail)({}, { message: "Email formati noto'g'ri." }),
    __metadata("design:type", String)
], RequestRegisterOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+998901234567' }),
    (0, class_validator_1.IsString)({ message: "Telefon raqam matn bo'lishi kerak." }),
    (0, class_validator_1.Matches)(/^\+998\d{9}$/, {
        message: "Telefon raqam +998901234567 formatida bo'lishi kerak.",
    }),
    __metadata("design:type", String)
], RequestRegisterOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Customer123!' }),
    (0, class_validator_1.IsString)({ message: "Parol matn bo'lishi kerak." }),
    (0, class_validator_1.MinLength)(6, { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." }),
    __metadata("design:type", String)
], RequestRegisterOtpDto.prototype, "password", void 0);
//# sourceMappingURL=request-register-otp.dto.js.map
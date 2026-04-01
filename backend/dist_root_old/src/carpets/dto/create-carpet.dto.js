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
exports.CreateCarpetDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCarpetDto {
    name;
    price;
    size;
    material;
    description;
    image;
    categoryId;
}
exports.CreateCarpetDto = CreateCarpetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Premium Turkish Carpet' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: "Nomi kamida 2 ta belgidan iborat bo'lishi kerak." }),
    (0, class_validator_1.MaxLength)(150, { message: "Nomi 150 ta belgidan oshmasligi kerak." }),
    __metadata("design:type", String)
], CreateCarpetDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 299.99 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: "Narx son ko'rinishida bo'lishi kerak." }),
    (0, class_validator_1.IsPositive)({ message: "Narx 0 dan katta bo'lishi kerak." }),
    __metadata("design:type", Number)
], CreateCarpetDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '200x300 sm' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: "O'lcham bo'sh bo'lmasligi kerak." }),
    __metadata("design:type", String)
], CreateCarpetDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jun' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Material bo`sh bo`lmasligi kerak.' }),
    __metadata("design:type", String)
], CreateCarpetDto.prototype, "material", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Yuqori sifatli gilam, qo'lda to'qilgan." }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCarpetDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '/uploads/1710000000000-file.webp' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCarpetDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cm9xxxxxx' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarpetDto.prototype, "categoryId", void 0);
//# sourceMappingURL=create-carpet.dto.js.map
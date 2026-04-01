"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
function mapValidationMessage(constraint) {
    const normalized = constraint.toLowerCase();
    if (normalized.includes('must be an email'))
        return "Email formati noto'g'ri.";
    if (normalized.includes('must be a string'))
        return "Maydon matn ko'rinishida bo'lishi kerak.";
    if (normalized.includes('must not be empty'))
        return "Maydon bo'sh bo'lmasligi kerak.";
    if (normalized.includes('must be longer'))
        return "Maydon juda qisqa.";
    if (normalized.includes('must be shorter'))
        return "Maydon juda uzun.";
    if (normalized.includes('must be a number'))
        return "Maydon son bo'lishi kerak.";
    if (normalized.includes('must be a positive number'))
        return "Maydon 0 dan katta bo'lishi kerak.";
    if (normalized.includes('must be an integer number'))
        return "Maydon butun son bo'lishi kerak.";
    if (normalized.includes('must be one of'))
        return "Maydon qiymati ruxsat etilgan variantlardan biri bo'lishi kerak.";
    if (normalized.includes('must be a phone number'))
        return "Telefon raqam formati noto'g'ri.";
    if (normalized.includes('must be longer than or equal to'))
        return "Maydon uzunligi yetarli emas.";
    if (normalized.includes('must be shorter than or equal to'))
        return "Maydon uzunligi juda katta.";
    return constraint;
}
async function bootstrap() {
    (0, fs_1.mkdirSync)('uploads', { recursive: true });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const validationMessages = errors.flatMap((error) => Object.values(error.constraints ?? {}).map(mapValidationMessage));
            return new common_1.BadRequestException({
                message: validationMessages[0] ?? "So'rov ma'lumotlarida xatolik mavjud.",
                errors: validationMessages,
            });
        },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('YEC Tashkent API')
        .setDescription('Gilam savdosi uchun backend API hujjatlari')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        jsonDocumentUrl: 'docs-json',
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map
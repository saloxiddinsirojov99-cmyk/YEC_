"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Serverda kutilmagan xatolik yuz berdi.';
        let errors;
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            const prismaCode = exception.code;
            if (prismaCode === 'P2002') {
                message = "Bu ma'lumot allaqachon mavjud.";
            }
            else if (prismaCode === 'P2025') {
                message = "So'ralgan ma'lumot topilmadi.";
                status = common_1.HttpStatus.NOT_FOUND;
            }
            else {
                message = "Ma'lumotlar bazasida xatolik yuz berdi.";
            }
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = this.translateMessage(res);
            }
            else if (typeof res === 'object' && res !== null) {
                const responseObj = res;
                if (Array.isArray(responseObj.message)) {
                    errors = responseObj.message.map((m) => this.translateMessage(m));
                    message = errors[0] ?? "So'rovda xatolik mavjud.";
                }
                else if (typeof responseObj.message === 'string') {
                    message = this.translateMessage(responseObj.message);
                }
                if (Array.isArray(responseObj.errors)) {
                    errors = responseObj.errors.map((m) => this.translateMessage(m));
                }
            }
        }
        else if (exception instanceof Error) {
            message = this.translateMessage(exception.message);
        }
        response.status(status).json({
            statusCode: status,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
    translateMessage(message) {
        const normalized = message.toLowerCase();
        if (normalized.includes('unauthorized'))
            return "Avtorizatsiya talab qilinadi.";
        if (normalized.includes('forbidden'))
            return 'Bu amal uchun ruxsat yo`q.';
        if (normalized.includes('validation failed'))
            return "So'rov ma'lumotlari noto'g'ri.";
        if (normalized.includes('cannot get'))
            return "So'ralgan endpoint topilmadi.";
        if (normalized.includes('not found'))
            return "So'ralgan ma'lumot topilmadi.";
        if (normalized.includes('invalid credentials'))
            return "Email yoki parol noto'g'ri.";
        if (normalized.includes('jwt'))
            return "Token noto'g'ri yoki muddati tugagan.";
        return message;
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map
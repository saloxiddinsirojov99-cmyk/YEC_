"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    prisma;
    mailService;
    constructor(usersService, jwtService, prisma, mailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async requestRegisterOtp(dto) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.BadRequestException("Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.");
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const otp = this.generateOtpCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.otpCode.updateMany({
            where: {
                email: dto.email,
                purpose: client_1.OtpPurpose.REGISTER,
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        });
        await this.prisma.otpCode.create({
            data: {
                email: dto.email,
                code: otp,
                purpose: client_1.OtpPurpose.REGISTER,
                pendingName: dto.name,
                pendingPhone: dto.phone,
                pendingPassword: hashedPassword,
                expiresAt,
            },
        });
        try {
            await this.mailService.sendOtpEmail(dto.email, otp);
            return {
                message: 'Tasdiqlash kodi emailingizga yuborildi.',
            };
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                return {
                    message: "SMTP sozlanmagani uchun OTP email yuborilmadi. Dev rejimda kod qaytarildi.",
                    devOtpCode: otp,
                };
            }
            throw new common_1.InternalServerErrorException("OTP kodni emailga yuborishda xatolik yuz berdi.");
        }
    }
    async verifyRegisterOtp(dto) {
        const otpRecord = await this.prisma.otpCode.findFirst({
            where: {
                email: dto.email,
                purpose: client_1.OtpPurpose.REGISTER,
                usedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpRecord) {
            throw new common_1.BadRequestException("OTP kod topilmadi yoki muddati tugagan.");
        }
        if (otpRecord.expiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException("OTP kod muddati tugagan.");
        }
        if (otpRecord.code !== dto.otp) {
            throw new common_1.UnauthorizedException("OTP kod noto'g'ri.");
        }
        if (!otpRecord.pendingPassword) {
            throw new common_1.BadRequestException("Ro'yxatdan o'tish ma'lumotlari topilmadi.");
        }
        if (!otpRecord.pendingName || !otpRecord.pendingPhone) {
            throw new common_1.BadRequestException("Ro'yxatdan o'tish ma'lumotlari to'liq emas.");
        }
        const createdUser = await this.usersService.createCustomer(otpRecord.pendingName, dto.email, otpRecord.pendingPhone, otpRecord.pendingPassword);
        await this.prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { usedAt: new Date() },
        });
        return {
            message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.",
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                phone: createdUser.phone,
                role: createdUser.role,
            },
        };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException("Email yoki parol noto'g'ri.");
        }
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException("Email yoki parol noto'g'ri.");
        }
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        };
    }
    async createAdmin(dto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const admin = await this.usersService.createAdmin(dto.name, dto.email, dto.phone, hashedPassword);
        return {
            message: 'Yangi admin muvaffaqiyatli yaratildi.',
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                role: admin.role,
            },
        };
    }
    generateOtpCode() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
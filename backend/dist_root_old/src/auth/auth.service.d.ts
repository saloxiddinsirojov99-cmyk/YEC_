import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly prisma;
    private readonly mailService;
    constructor(usersService: UsersService, jwtService: JwtService, prisma: PrismaService, mailService: MailService);
    requestRegisterOtp(dto: RequestRegisterOtpDto): Promise<{
        message: string;
        devOtpCode?: undefined;
    } | {
        message: string;
        devOtpCode: string;
    }>;
    verifyRegisterOtp(dto: VerifyRegisterOtpDto): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string;
            role: string;
        };
    }>;
    createAdmin(dto: CreateAdminDto): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    private generateOtpCode;
}

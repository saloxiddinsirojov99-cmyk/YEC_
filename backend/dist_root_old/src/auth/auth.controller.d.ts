import { AuthService } from './auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginDto } from './dto/login.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestRegisterOtp(dto: RequestRegisterOtpDto): Promise<{
        message: string;
        devOtpCode?: undefined;
    } | {
        message: string;
        devOtpCode: string;
    }>;
    register(dto: RequestRegisterOtpDto): Promise<{
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
}

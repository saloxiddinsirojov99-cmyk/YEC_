import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import * as compression from 'compression';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { RequestForgotPasswordDto } from './dto/request-forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async requestRegisterOtp(dto: RequestRegisterOtpDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException(
        "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.",
      );
    }

    const fullName = this.buildFullName(dto.firstName, dto.lastName);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpCode.updateMany({
      where: {
        email: dto.email,
        purpose: OtpPurpose.REGISTER,
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
        purpose: OtpPurpose.REGISTER,
        pendingName: fullName,
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
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          message:
            'SMTP sozlanmagani uchun Tasdiqlash kodi emailga yuborilmadi. Dev rejimda kod qaytarildi.',
          devOtpCode: otp,
        };
      }
      throw new InternalServerErrorException(
        'Tasdiqlash kodini emailga yuborishda xatolik yuz berdi.',
      );
    }
  }

  async verifyRegisterOtp(dto: VerifyRegisterOtpDto) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email: dto.email,
        purpose: OtpPurpose.REGISTER,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        'Tasdiqlash kodi topilmadi yoki muddati tugagan.',
      );
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Tasdiqlash kodi muddati tugagan.');
    }

    if (otpRecord.code !== dto.otp) {
      throw new UnauthorizedException("Tasdiqlash kodi noto'g'ri.");
    }

    if (!otpRecord.pendingPassword) {
      throw new BadRequestException(
        "Ro'yxatdan o'tish ma'lumotlari topilmadi.",
      );
    }
    if (!otpRecord.pendingName || !otpRecord.pendingPhone) {
      throw new BadRequestException(
        "Ro'yxatdan o'tish ma'lumotlari to'liq emas.",
      );
    }

    const createdUser = await this.usersService.createCustomer(
      otpRecord.pendingName,
      dto.email,
      otpRecord.pendingPhone,
      otpRecord.pendingPassword,
    );

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    const tokens = await this.generateTokens(createdUser);

    return {
      message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.",
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
  }> {
    const user = await this.usersService.findByCredential(dto.email);

    if (!user) {
      throw new UnauthorizedException("Ma'lumotlar noto'g'ri.");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Parol noto'g'ri.");
    }

    const accessToken = await this.signAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const refreshToken = await this.signRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      avatar?: string | null;
    };
  }> {
    const phoneFromGoogle =
      this.normalizePhoneFromGoogle(profile.phone) ??
      this.normalizePhoneFromGoogle(
        await this.fetchGooglePhone(profile.accessToken),
      );
    const user = await this.findOrCreateGoogleUser(profile, phoneFromGoogle);

    const accessToken = await this.signAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const refreshToken = await this.signRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token topilmadi.');
    }

    const refreshSecret = this.getRefreshSecret();
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token muddati tugagan.');
    }

    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException("Refresh token noto'g'ri.");
    }

    const user = await this.usersService.findById(payload.sub);
    const accessToken = await this.signAccessToken(
      user.id,
      user.email,
      user.role,
    );
    return { accessToken };
  }

  async createAdmin(dto: CreateAdminDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = await this.usersService.createAdmin(
      dto.name,
      dto.email,
      dto.phone,
      hashedPassword,
    );

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

  private generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async findOrCreateGoogleUser(
    profile: GoogleProfile,
    phoneFromGoogle?: string | null,
  ) {
    const email = profile.email.trim().toLowerCase();
    const rawName = profile.name?.trim();
    const existing = await this.usersService.findByEmail(email);

    if (!existing) {
      const randomPassword = randomBytes(24).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const name = rawName || email.split('@')[0];

      return this.prisma.user.create({
        data: {
          name,
          email,
          phone: phoneFromGoogle ?? '',
          password: hashedPassword,
          role: UserRole.CUSTOMER,
          avatar: profile.avatar ?? null,
        },
      });
    }

    const updates: Record<string, string> = {};
    if (
      rawName &&
      (existing.name.trim().length === 0 || existing.name === existing.email)
    ) {
      updates.name = rawName;
    }
    if (profile.avatar && !existing.avatar) {
      updates.avatar = profile.avatar;
    }
    if (phoneFromGoogle && (!existing.phone || existing.phone.trim().length === 0)) {
      updates.phone = phoneFromGoogle;
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    return this.prisma.user.update({
      where: { id: existing.id },
      data: updates,
    });
  }
  
  async requestForgotPasswordOtp(dto: RequestForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // For security, don't reveal if user exists or not, but in this case we return success
      return { message: 'Agar ushbu email bazada mavjud bo\'lsa, unga tasdiqlash kodi yuborildi.' };
    }

    const otp = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpCode.updateMany({
      where: {
        email: dto.email,
        purpose: OtpPurpose.FORGOT_PASSWORD,
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
        purpose: OtpPurpose.FORGOT_PASSWORD,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendOtpEmail(dto.email, otp);
      return { message: 'Tasdiqlash kodi emailingizga yuborildi.' };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          message: 'SMTP sozlanmagani uchun kod emailga yuborilmadi. Dev rejimda kod qaytarildi.',
          devOtpCode: otp,
        };
      }
      throw new InternalServerErrorException('Tasdiqlash kodini yuborishda xatolik yuz berdi.');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email: dto.email,
        purpose: OtpPurpose.FORGOT_PASSWORD,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.code !== dto.otp) {
      throw new UnauthorizedException("Tasdiqlash kodi noto'g'ri yoki muddati tugagan.");
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Tasdiqlash kodi muddati tugagan.');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Parol muvaffaqiyatli o\'zgartirildi.' };
  }

  private async fetchGooglePhone(
    accessToken?: string,
  ): Promise<string | null> {
    if (!accessToken) return null;
    const fetchFn = (globalThis as any).fetch as
      | ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>)
      | undefined;
    if (!fetchFn) return null;

    try {
      const response = await fetchFn(
        'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) return null;
      const data = (await response.json()) as {
        phoneNumbers?: Array<{ value?: string; canonicalForm?: string }>;
      };
      const first = data.phoneNumbers?.[0];
      return first?.canonicalForm || first?.value || null;
    } catch {
      return null;
    }
  }

  private normalizePhoneFromGoogle(phone?: string | null): string | null {
    if (!phone) return null;
    const normalized = String(phone).trim().replace(/[^\d+]/g, '');
    if (!normalized) return null;
    return normalized.startsWith('+') ? normalized : `+${normalized}`;
  }

  private buildFullName(firstName: string, lastName: string): string {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`
      .replace(/\s+/g, ' ')
      .trim();

    if (!trimmedFirst || !trimmedLast) {
      throw new BadRequestException(
        "Ism va familiya to'liq kiritilishi kerak.",
      );
    }

    if (fullName.length > 100) {
      throw new BadRequestException(
        'Ism va familiya uzunligi 100 ta belgidan oshmasligi kerak.',
      );
    }

    return fullName;
  }

  private getAccessExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1h');
  }

  private getRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '12h');
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      this.configService.get<string>('JWT_SECRET', 'super-secret-change-me'),
    );
  }

  private async signAccessToken(id: string, email: string, role: string) {
    return this.jwtService.signAsync(
      { sub: id, email, role },
      { expiresIn: this.getAccessExpiresIn() as any },
    );
  }

  private async signRefreshToken(id: string, email: string, role: string) {
    return this.jwtService.signAsync(
      { sub: id, email, role, type: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn() as any,
      },
    );
  }

  private async generateTokens(user: any) {
    const accessToken = await this.signAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const refreshToken = await this.signRefreshToken(
      user.id,
      user.email,
      user.role,
    );
    return { accessToken, refreshToken };
  }
}

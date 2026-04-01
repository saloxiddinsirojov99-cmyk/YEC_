import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { RequestForgotPasswordDto } from './dto/request-forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: "Ro'yxatdan o'tish uchun Tasdiqlash kodi so'rash" })
  @ApiResponse({
    status: 201,
    description: 'Tasdiqlash kodi emailga yuborildi.',
  })
  @ApiBody({ type: RequestRegisterOtpDto })
  @Public()
  @Post('register/request-otp')
  requestRegisterOtp(@Body() dto: RequestRegisterOtpDto) {
    return this.authService.requestRegisterOtp(dto);
  }

  @ApiOperation({
    summary: "Ro'yxatdan o'tish (Tasdiqlash kodi emailga yuboriladi)",
  })
  @ApiResponse({
    status: 201,
    description: 'Tasdiqlash kodi emailga yuborildi.',
  })
  @ApiBody({ type: RequestRegisterOtpDto })
  @Public()
  @Post('register')
  register(@Body() dto: RequestRegisterOtpDto) {
    return this.authService.requestRegisterOtp(dto);
  }

  @ApiOperation({
    summary: "Tasdiqlash kodi bilan ro'yxatdan o'tishni yakunlash",
  })
  @ApiResponse({ status: 201, description: "Ro'yxatdan o'tish yakunlandi." })
  @ApiBody({ type: VerifyRegisterOtpDto })
  @Public()
  @Post('register/verify-otp')
  verifyRegisterOtp(@Body() dto: VerifyRegisterOtpDto) {
    return this.authService.verifyRegisterOtp(dto);
  }
  
  @ApiOperation({ summary: "Parolni unutgan bo'lsa kod yuborish" })
  @ApiResponse({ status: 200, description: 'Tasdiqlash kodi yuborildi.' })
  @Public()
  @Post('forgot-password/request-otp')
  requestForgotPasswordOtp(@Body() dto: RequestForgotPasswordDto) {
    return this.authService.requestForgotPasswordOtp(dto);
  }

  @ApiOperation({ summary: "Yangi parol o'rnatish" })
  @ApiResponse({ status: 200, description: "Parol muvaffaqiyatli o'zgartirildi." })
  @Public()
  @Post('forgot-password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Tizimga kirish (admin/customer)' })
  @ApiResponse({ status: 200, description: 'Kirish muvaffaqiyatli.' })
  @ApiBody({ type: LoginDto })
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Access tokenni refresh qilish' })
  @ApiResponse({ status: 200, description: 'Yangi access token qaytarildi.' })
  @ApiBody({ type: RefreshTokenDto })
  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @ApiOperation({ summary: "Yangi admin qo'shish (faqat admin)" })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Yangi admin yaratildi.' })
  @ApiBody({ type: CreateAdminDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(dto);
  }

  @ApiOperation({ summary: 'Google orqali login' })
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return;
  }

  @ApiOperation({ summary: 'Google login callback' })
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontUrl =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ??
      'http://localhost:3002';

    if (!req.user) {
      const loginUrl = new URL('/login', frontUrl);
      loginUrl.searchParams.set(
        'oauthError',
        'Google akkaunt ma`lumotlarini olishda xatolik yuz berdi.',
      );
      return res.redirect(loginUrl.toString());
    }

    const loginResult = await this.authService.loginWithGoogle(
      req.user as any,
    );

    const redirectUrl = new URL('/auth/google/callback', frontUrl);
    redirectUrl.searchParams.set('accessToken', loginResult.accessToken);
    redirectUrl.searchParams.set('refreshToken', loginResult.refreshToken);

    return res.redirect(redirectUrl.toString());
  }
}

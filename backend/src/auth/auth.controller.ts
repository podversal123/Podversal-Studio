import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private users: UsersService,
  ) {}

  // POST /api/auth/register — public signup, always creates CUSTOMER
  // Admins/Employees are created by SUPER_ADMIN via /employees or /agents endpoints
  @Post('register')
  register(@Body() dto: RegisterDto) {
    // Strip any role passed by public users — only CUSTOMER allowed from this endpoint
    dto.role = undefined;
    return this.auth.register(dto);
  }

  // POST /api/auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // GET /api/auth/google  — redirects to Google consent screen
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  // GET /api/auth/google/callback  — Google redirects here after login
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.auth.googleLogin(req.user);
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3002').split(',')[0].trim();
    const params = new URLSearchParams({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      user:         JSON.stringify(result.user),
    });
    return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  // POST /api/auth/otp/send
  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto.phone);
  }

  // POST /api/auth/otp/verify
  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.otp);
  }

  // POST /api/auth/create-staff — SUPER_ADMIN only, creates STUDIO_MANAGER accounts
  @Post('create-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  createStaff(@Body() dto: RegisterDto) {
    // Only STUDIO_MANAGER allowed via this route
    dto.role = Role.STUDIO_MANAGER;
    return this.auth.register(dto);
  }

  // GET /api/auth/managers — SUPER_ADMIN only, lists all Studio Managers
  @Get('managers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  getManagers() {
    return this.users.findManagers();
  }

  // POST /api/auth/setup-admin — one-time only, creates first SUPER_ADMIN if none exists
  @Post('setup-admin')
  setupAdmin(@Body() dto: RegisterDto) {
    return this.auth.setupAdmin(dto);
  }

  // POST /api/auth/forgot-password
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.auth.forgotPassword(body.email).then(() => ({
      message: 'If that email is registered, a reset link has been sent.',
    }));
  }

  // POST /api/auth/reset-password
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.auth.resetPassword(body.token, body.password).then(() => ({
      message: 'Password updated successfully.',
    }));
  }

  // GET /api/auth/me  — returns full profile for logged-in user
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const fresh = await this.users.findById(user.id);
    if (!fresh) return user;
    return {
      id:          fresh.id,
      name:        fresh.name,
      email:       fresh.email,
      phone:       fresh.phone,
      role:        fresh.role,
      avatarUrl:   (fresh as any).avatarUrl ?? null,
      createdAt:   fresh.createdAt,
      hasPassword: !!fresh.password,
    };
  }

  // PATCH /api/auth/profile — update name / phone
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: any,
    @Body() body: { name?: string; phone?: string },
  ) {
    return this.users.updateProfile(user.id, body);
  }

  // POST /api/auth/change-password
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.users.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  // POST /api/auth/profile/avatar — accepts base64 data URL, uploads to Cloudinary
  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  uploadAvatar(
    @CurrentUser() user: any,
    @Body() body: { file: string },
  ) {
    return this.users.uploadAvatar(user.id, body.file);
  }
}

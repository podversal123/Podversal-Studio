import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

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
  googleCallback(@Req() req: any) {
    return this.auth.googleLogin(req.user);
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
    dto.role = 'STUDIO_MANAGER' as any;
    return this.auth.register(dto);
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

  // GET /api/auth/me  — returns logged-in user's info
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return user;
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    return this.generateTokens(user);
  }

  async googleLogin(googleUser: { googleId: string; email: string; name: string }) {
    const user = await this.users.findOrCreateGoogleUser(googleUser);
    return this.generateTokens(user);
  }

  async sendOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.saveOtp(phone, otp);
    await this.dispatchSms(phone, otp);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string) {
    const stored = await this.redis.getOtp(phone);

    if (!stored || stored !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.redis.deleteOtp(phone);

    let user = await this.users.findByPhone(phone);
    if (!user) {
      // New customer via OTP — placeholder email updated when they complete profile
      user = await this.users.create({
        name: phone,
        email: `otp_${phone}@podversal.in`,
        phone,
        role: Role.CUSTOMER,
      });
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: { id: string; email: string; role: string; name: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    // Resolve the role-specific profile ID so the frontend can call
    // agent/customer/employee endpoints without an extra lookup
    const profileId = await this.resolveProfileId(user.id, user.role);

    return {
      accessToken,
      refreshToken,
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        profileId, // null for SUPER_ADMIN and STUDIO_MANAGER
      },
    };
  }

  // Returns the linked profile row ID for REFERRAL_AGENT, CUSTOMER, EMPLOYEE
  private async resolveProfileId(userId: string, role: string): Promise<string | null> {
    if (role === 'REFERRAL_AGENT') {
      const agent = await this.prisma.agent.findUnique({ where: { userId }, select: { id: true } });
      return agent?.id ?? null;
    }
    if (role === 'CUSTOMER') {
      const customer = await this.prisma.customer.findUnique({ where: { userId }, select: { id: true } });
      return customer?.id ?? null;
    }
    if (role === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({ where: { userId }, select: { id: true } });
      return employee?.id ?? null;
    }
    return null;
  }

  async setupAdmin(dto: RegisterDto) {
    const adminCount = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
    if (adminCount > 0) {
      throw new BadRequestException(
        'A Super Admin account already exists. Use the login page to sign in.',
      );
    }
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user   = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed, role: Role.SUPER_ADMIN },
    });
    return this.generateTokens(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.password) return; // silently ignore — don't reveal if email exists

    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`reset:${token}`, user.id, 900); // 15-minute TTL

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3002';
    const resetUrl    = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <p style="font-size:13px;color:#6b6b6b;margin-bottom:24px;">Podversal Studio</p>
        <h1 style="font-size:24px;font-weight:900;color:#111;margin-bottom:12px;">Reset your password</h1>
        <p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px;">
          We received a request to reset the password for your account. Click the button below to set a new password.
          This link expires in 15 minutes.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#E5312A;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;text-decoration:none;">
          Reset Password
        </a>
        <p style="font-size:12px;color:#aaa;margin-top:24px;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
      </div>
    `;

    this.notifications.sendRawEmail(email, 'Reset your Podversal Studio password', html).catch(() => {
      // Log but don't throw — token is already created and valid
      if (this.config.get('NODE_ENV') !== 'production') {
        console.log(`[DEV FORGOT PASSWORD] Reset URL: ${resetUrl}`);
      }
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`reset:${token}`);
    if (!userId) throw new BadRequestException('This reset link has expired or is invalid. Please request a new one.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await this.redis.del(`reset:${token}`);
  }

  private async dispatchSms(phone: string, otp: string) {
    // In development, print OTP to console instead of sending real SMS
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      console.log(`[DEV OTP] Phone: ${phone} → OTP: ${otp}`);
      return;
    }

    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');
    const senderId = this.config.get<string>('MSG91_SENDER_ID');

    await fetch(
      `https://api.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${phone}&authkey=${authKey}&otp=${otp}&sender=${senderId}`,
    );
  }
}

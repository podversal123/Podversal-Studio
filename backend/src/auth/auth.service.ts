import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { Role } from "@prisma/client";
import { UsersService } from "../users/users.service";
import { RedisService } from "../redis/redis.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RegisterDto } from "./dto/register.dto";
import { SetupAdminDto } from "./dto/setup-admin.dto";
import { LoginDto } from "./dto/login.dto";

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
    if (existing) throw new ConflictException("Email already registered");

    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
    });

    if (dto.role === Role.STUDIO_MANAGER && dto.password) {
      const loginUrl = `${this.config.get<string>("FRONTEND_URL")?.split(",")[0]}/staff/login`;
      this.notifications
        .sendCredentialsEmail(
          user.email,
          user.name,
          dto.password,
          loginUrl,
          "Studio Manager",
        )
        .catch(() => {});
    } else {
      this.notifications
        .sendWelcomeEmail(user.email, user.name)
        .catch(() => {});
    }

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException("Invalid email or password");

    if (!user.isActive)
      throw new UnauthorizedException("Account is deactivated");

    return this.generateTokens(user);
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
  }) {
    const { user, isNew } = await this.users.findOrCreateGoogleUser(googleUser);
    if (isNew) {
      this.notifications
        .sendWelcomeEmail(user.email, user.name)
        .catch(() => {});
    }
    return this.generateTokens(user);
  }

  async sendOtp(phone: string) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    await this.redis.saveOtp(phone, otp);
    await this.dispatchSms(phone, otp);
    return { message: "OTP sent successfully" };
  }

  async verifyOtp(phone: string, otp: string) {
    const stored = await this.redis.getOtp(phone);

    if (!stored || stored !== otp) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this.redis.deleteOtp(phone);

    let user = await this.users.findByPhone(phone);
    if (!user) {
      // New customer via OTP  placeholder email updated when they complete profile
      user = await this.users.create({
        name: phone,
        email: `otp_${phone}@otp.internal`,
        phone,
        role: Role.CUSTOMER,
      });
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    name: string;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("JWT_SECRET"),
      expiresIn: this.config.get<string>("JWT_EXPIRES_IN"),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN"),
    });

    // Resolve the role-specific profile ID so the frontend can call
    // agent/customer/employee endpoints without an extra lookup
    const profileId = await this.resolveProfileId(user.id, user.role);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId, // null for SUPER_ADMIN and STUDIO_MANAGER
      },
    };
  }

  // Returns the linked profile row ID for REFERRAL_AGENT, CUSTOMER, EMPLOYEE
  private async resolveProfileId(
    userId: string,
    role: string,
  ): Promise<string | null> {
    if (role === "REFERRAL_AGENT") {
      const agent = await this.prisma.agent.findUnique({
        where: { userId },
        select: { id: true },
      });
      return agent?.id ?? null;
    }
    if (role === "CUSTOMER") {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
        select: { id: true },
      });
      return customer?.id ?? null;
    }
    if (role === "EMPLOYEE") {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
        select: { id: true },
      });
      return employee?.id ?? null;
    }
    return null;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      }) as { sub: string; email: string; role: string };

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive)
        throw new UnauthorizedException("Account not found or deactivated");

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  // Stores a fully-generated login result under a random one-time code so
  // the OAuth redirect URL only ever carries an opaque code, never the
  // actual tokens. 60s TTL and deleted on first read.
  async createExchangeCode(result: {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  }): Promise<string> {
    const code = crypto.randomBytes(24).toString("hex");
    await this.redis.set(`oauth-exchange:${code}`, JSON.stringify(result), 60);
    return code;
  }

  async exchangeCode(code: string) {
    if (!code) throw new BadRequestException("Missing exchange code");
    const key = `oauth-exchange:${code}`;
    const raw = await this.redis.get(key);
    if (!raw)
      throw new UnauthorizedException(
        "This sign-in link has expired. Please try again.",
      );
    await this.redis.del(key); // one-time use
    return JSON.parse(raw);
  }

  async setupAdmin(dto: SetupAdminDto) {
    const expectedSecret = this.config.get<string>("SETUP_SECRET");
    if (!expectedSecret) {
      throw new BadRequestException(
        "Admin setup is not configured. Set SETUP_SECRET in the server environment first.",
      );
    }
    if (dto.setupSecret !== expectedSecret) {
      throw new UnauthorizedException("Invalid setup key");
    }

    const adminCount = await this.prisma.user.count({
      where: { role: Role.SUPER_ADMIN },
    });
    if (adminCount > 0) {
      throw new BadRequestException(
        "A Super Admin account already exists. Use the login page to sign in.",
      );
    }
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException("Email already registered");

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: Role.SUPER_ADMIN,
      },
    });
    return this.generateTokens(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) return; // silently ignore  don't reveal if email exists
    // Google-only users can also reset/set a password via this flow

    const token = crypto.randomBytes(32).toString("hex");
    await this.redis.set(`reset:${token}`, user.id, 900); // 15-minute TTL

    const frontendUrl = (
      this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3002"
    )
      .split(",")[0]
      .trim();
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const emailLogoUrl = this.config.get<string>("EMAIL_LOGO_URL");
    const logoHtml = emailLogoUrl
      ? `<img src="${emailLogoUrl}" alt="Podversal Studio" height="150" style="display:block;margin:0 auto;border:0;" />`
      : `<span style="color:#E5312A;font-size:20px;font-weight:900;letter-spacing:0.08em;">PODVERSAL STUDIO</span>`;

    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  body { font-family: Arial, sans-serif; background: #f5f5f5 !important; margin: 0; padding: 0; }
  .wrap { max-width: 540px; margin: 32px auto; background: #ffffff !important; border: 1px solid #e5e5e5; }
  .top  { background: #ffffff !important; padding: 20px 32px; text-align: center; }
  .body { padding: 28px 32px; color: #222222 !important; font-size: 14px; line-height: 1.7; background: #ffffff !important; }
  .body p { margin: 0 0 16px 0; color: #222222 !important; }
  .body p:last-child { margin-bottom: 0; }
  .foot { padding: 16px 32px; font-size: 11px; color: #aaaaaa !important; border-top: 1px solid #eeeeee; background: #ffffff !important; }
</style>
</head>
<body bgcolor="#f5f5f5">
  <div class="wrap" bgcolor="#ffffff">
    <div class="top" bgcolor="#ffffff">${logoHtml}</div>
    <div style="display:none;max-height:0;overflow:hidden;">${Date.now()}</div>
    <div class="body">
      <p>We received a password reset request for your Podversal Studio account. Use the button below to set a new password. This link is valid for 15 minutes only.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#E5312A;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;text-decoration:none;">Reset Password</a></p>
      <p style="color:#888;font-size:12px;">If you didn't request this, ignore this email. Your password won't change.</p>
    </div>
    <div class="foot">Podversal Studio &nbsp;|&nbsp; Reply to this email or call us if you have any questions.</div>
  </div>
</body></html>`;

    this.notifications
      .sendRawEmail(email, "Reset your Podversal Studio password", html)
      .catch(() => {
        // Log but don't throw  token is already created and valid
        if (this.config.get("NODE_ENV") !== "production") {
          console.log(`[DEV FORGOT PASSWORD] Reset URL: ${resetUrl}`);
        }
      });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`reset:${token}`);
    if (!userId)
      throw new BadRequestException(
        "This reset link has expired or is invalid. Please request a new one.",
      );

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    await this.redis.del(`reset:${token}`);
  }

  private async dispatchSms(phone: string, otp: string) {
    if (this.config.get<string>("NODE_ENV") !== "production") {
      console.log(`[DEV OTP] Phone: ${phone} → OTP: ${otp}`);
      return;
    }

    const apiKey = this.config.get<string>("TWO_FACTOR_API_KEY");

    try {
      const res = await fetch(
        `https://2factor.in/API/V1/${apiKey}/SMS/91${phone}/${otp}`,
      );
      const data = (await res.json()) as { Status: string; Details: string };
      if (data.Status !== "Success") {
        console.error(`[SMS FAILED] Phone: ${phone} | ${data.Details}`);
      }
    } catch (err: any) {
      console.error(`[SMS FAILED] Phone: ${phone} | ${err?.message ?? err}`);
    }
  }
}

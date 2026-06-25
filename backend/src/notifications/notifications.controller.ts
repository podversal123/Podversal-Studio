import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const sanitize = (s: string) =>
  s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));

@Controller('notifications')
export class NotificationsController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // SUPER_ADMIN sees all; STUDIO_MANAGER sees only their own
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  async findAll(@CurrentUser() user: any) {
    const where = user.role === 'SUPER_ADMIN' ? {} : { userId: user.id };
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // POST /api/notifications/test?to=yourEmail — SUPER_ADMIN only
  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async testEmails(@Query('to') to: string) {
    const target = to || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!target) return { error: 'Provide ?to=email or set ADMIN_EMAIL in .env' };
    return this.notifications.sendTestEmails(target);
  }

  @Post('contact')
  async contact(@Body() body: { name: string; phone?: string; email: string; message: string }) {
    const name    = sanitize(String(body.name    ?? '').trim().slice(0, 200));
    const phone   = sanitize(String(body.phone   ?? '').trim().slice(0, 20));
    const email   = sanitize(String(body.email   ?? '').trim().slice(0, 200));
    const message = sanitize(String(body.message ?? '').trim().slice(0, 2000)).replace(/\n/g, '<br>');

    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.SMTP_USER;
    if (!adminEmail) return { success: true };

    const emailLogoUrl = process.env.EMAIL_LOGO_URL;
    const logoHtml = emailLogoUrl
      ? `<img src="${emailLogoUrl}" alt="Podversal Studio" height="150" style="display:block;margin:0 auto;border:0;" />`
      : `<span style="color:#E5312A;font-size:20px;font-weight:900;letter-spacing:0.08em;">PODVERSAL STUDIO</span>`;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:540px;margin:32px auto;background:#fff;border:1px solid #e5e5e5;">
    <div style="background:#fff;padding:12px 32px;text-align:center;">
      ${logoHtml}
    </div>
    <div style="padding:24px 28px;font-size:14px;color:#222;line-height:1.7;">
      <p style="margin-top:0;font-weight:bold;">New enquiry from the website</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;width:80px;">Name</td><td style="padding:6px 0;"><strong>${name}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888;">Phone</td><td style="padding:6px 0;">${phone || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;">${email}</td></tr>
        <tr><td style="padding:6px 0;color:#888;vertical-align:top;">Message</td><td style="padding:6px 0;">${message}</td></tr>
      </table>
    </div>
    <div style="padding:14px 28px;font-size:11px;color:#aaa;border-top:1px solid #eee;">Sent via podversal.com contact form.</div>
  </div>
</body></html>`;

    this.notifications.sendRawEmail(adminEmail, `New Enquiry from ${name}`, html).catch((err: any) => {
      console.error(`[Contact] FAILED: ${err?.message ?? err}`);
    });

    return { success: true };
  }
}

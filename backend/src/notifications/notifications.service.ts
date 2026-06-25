import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationEvent =
  | 'BOOKING_CREATED'
  | 'QUOTE_SENT'
  | 'BOOKING_APPROVED'
  | 'PAYMENT_RECEIVED'
  | 'SHOOT_REMINDER'
  | 'BOOKING_CANCELLED'
  | 'INVOICE_GENERATED';

const logoHtml = () => {
  const url = process.env.EMAIL_LOGO_URL;
  return url
    ? `<img src="${url}" alt="Podversal Studio" height="150" style="display:block;margin:0 auto;border:0;" />`
    : `<span style="color:#E5312A;font-size:20px;font-weight:900;letter-spacing:0.08em;">PODVERSAL STUDIO</span>`;
};

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async sendBookingNotification(bookingId: string, event: NotificationEvent) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: {
        service:  true,
        customer: { include: { user: { select: { email: true, name: true } } } },
        createdBy: true,
        employee:  { include: { user: { select: { email: true, name: true } } } },
        agent:     { include: { user: { select: { email: true, name: true } } } },
      },
    });
    if (!booking) return;

    // Always use the email/name submitted on the booking form (avoids otp_PHONE@otp.internal for OTP users)
    const email = booking.customerEmail || booking.customer?.user?.email || booking.createdBy.email;
    const name  = booking.customerName  || booking.customer?.user?.name  || booking.createdBy.name;

    const { subject, html } = this.buildEmail(event, { booking, name });

    // Send to customer
    await this.send(email, subject, html);

    // Notify admin on new booking, payment received, and shoot reminder
    const notifyAdmin = event === 'BOOKING_CREATED' || event === 'PAYMENT_RECEIVED' || event === 'SHOOT_REMINDER';
    if (notifyAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (adminEmail && email !== adminEmail) {
        const adminSubject = event === 'SHOOT_REMINDER'
          ? `[Tomorrow] ${subject}`
          : `[New] ${subject}`;
        const adminHtml = html
          .replace(`<p>Hi ${name},</p>`, `<p>Hi Studio Team,</p><p style="color:#888;font-size:12px;margin-top:0;">Customer: ${name} &lt;${email}&gt;</p>`);
        await this.send(adminEmail, adminSubject, adminHtml);
      }
    }

    // Send shoot reminder to assigned employee
    if (event === 'SHOOT_REMINDER' && booking.employee?.user?.email) {
      const empEmail = booking.employee.user.email;
      const empName  = booking.employee.user.name;
      const date     = new Date(booking.shootDate).toLocaleDateString('en-IN', { dateStyle: 'full' });
      const time     = `${booking.startTime} – ${booking.endTime}`;
      const empHtml  = this.wrapEmail(`
        <p>Hi ${empName},</p>
        <p>Reminder: you have a <strong>${booking.service.name}</strong> shoot scheduled for tomorrow.</p>
        <p><strong>Date:</strong> ${date}<br>
        <strong>Time:</strong> ${time}<br>
        <strong>Customer:</strong> ${name}<br>
        <strong>Booking:</strong> ${booking.bookingCode}</p>
        <p>Please be ready at the studio on time.</p>
      `);
      await this.send(empEmail, `[Tomorrow] Your shoot: ${booking.service.name} at ${booking.startTime}`, empHtml);
    }

    // Send shoot reminder to referred agent
    if (event === 'SHOOT_REMINDER' && booking.agent?.user?.email) {
      const agentEmail = booking.agent.user.email;
      const agentName  = booking.agent.user.name;
      const date       = new Date(booking.shootDate).toLocaleDateString('en-IN', { dateStyle: 'full' });
      const time       = `${booking.startTime} – ${booking.endTime}`;
      const agentHtml  = this.wrapEmail(`
        <p>Hi ${agentName},</p>
        <p>A booking you referred is scheduled for tomorrow.</p>
        <p><strong>Service:</strong> ${booking.service.name}<br>
        <strong>Date:</strong> ${date}<br>
        <strong>Time:</strong> ${time}<br>
        <strong>Customer:</strong> ${name}<br>
        <strong>Booking:</strong> ${booking.bookingCode}</p>
      `);
      await this.send(agentEmail, `[Tomorrow] Referred booking: ${booking.bookingCode}`, agentHtml);
    }

    // Send shoot reminder to all active Studio Managers
    if (event === 'SHOOT_REMINDER') {
      const managers = await this.prisma.user.findMany({
        where: { role: 'STUDIO_MANAGER', isActive: true },
        select: { email: true, name: true },
      });
      const date = new Date(booking.shootDate).toLocaleDateString('en-IN', { dateStyle: 'full' });
      const time = `${booking.startTime} – ${booking.endTime}`;
      await Promise.all(
        managers.map((manager) => {
          const html = this.wrapEmail(`
            <p>Hi ${manager.name},</p>
            <p>Reminder: there is a shoot scheduled for tomorrow that needs your attention.</p>
            <p><strong>Service:</strong> ${booking.service.name}<br>
            <strong>Date:</strong> ${date}<br>
            <strong>Time:</strong> ${time}<br>
            <strong>Customer:</strong> ${name}<br>
            <strong>Booking:</strong> ${booking.bookingCode}</p>
          `);
          return this.send(manager.email, `[Tomorrow] Shoot: ${booking.service.name} at ${booking.startTime} (${booking.bookingCode})`, html);
        }),
      );
    }

    // Persist notification record
    await this.prisma.notification.create({
      data: {
        userId:  booking.createdById,
        channel: 'EMAIL',
        subject,
        message: `Booking ${booking.bookingCode}: ${event.replace(/_/g, ' ')}`,
        isSent:  true,
      },
    });
  }

  private buildEmail(event: NotificationEvent, ctx: any) {
    const { booking, name } = ctx;
    const code    = booking.bookingCode;
    const service = booking.service.name;
    const date    = new Date(booking.shootDate).toLocaleDateString('en-IN', { dateStyle: 'full' });
    const time    = `${booking.startTime} – ${booking.endTime}`;
    const amount  = booking.totalAmount ? `₹${Number(booking.totalAmount).toLocaleString('en-IN')}` : '';

    const templates: Record<NotificationEvent, { subject: string; body: string }> = {
      BOOKING_CREATED: {
        subject: `Slot reserved — complete payment to confirm (${code})`,
        body: `We've received your booking request for <strong>${service}</strong> on <strong>${date}</strong> (${time}).<br><br>
Your slot is reserved. Please complete the payment to lock it. If payment isn't received, the slot will be released automatically.`,
      },
      QUOTE_SENT: {
        subject: `Your quote is ready — ${code}`,
        body: `Here's the pricing for your ${service} booking on ${date}:<br><br>
<strong>Total: ${amount}</strong><br>
Advance: ₹${Number(booking.advanceAmount).toLocaleString('en-IN')}<br><br>
Log in to your dashboard to approve and pay.`,
      },
      BOOKING_APPROVED: {
        subject: `Booking approved — pay to lock your slot (${code})`,
        body: `Your ${service} booking on ${date} (${time}) has been approved.<br><br>
Pay the advance amount to confirm your slot.`,
      },
      PAYMENT_RECEIVED: {
        subject: `Payment confirmed — see you on ${date} (${code})`,
        body: `Your payment is confirmed. The slot is locked.<br><br>
<strong>Booking:</strong> ${code}<br>
<strong>Service:</strong> ${service}<br>
<strong>Date:</strong> ${date}<br>
<strong>Time:</strong> ${time}<br><br>
See you on ${new Date(booking.shootDate).toLocaleDateString('en-IN', { weekday: 'long' })}!`,
      },
      SHOOT_REMINDER: {
        subject: `Tomorrow: ${service} at ${booking.startTime} (${code})`,
        body: `Your ${service} shoot is tomorrow — ${date}, from ${time}.<br><br>
Please arrive 10 minutes before your slot. If something has come up, let us know right away.`,
      },
      BOOKING_CANCELLED: {
        subject: `Booking cancelled — ${code}`,
        body: `Your booking ${code} for ${service} on ${date} has been cancelled.<br><br>
If you paid an advance and haven't heard from us about the refund, please reach out directly.`,
      },
      INVOICE_GENERATED: {
        subject: `Invoice ready — ${code}`,
        body: `Your invoice for ${service} on ${date} is ready. You can download it from your dashboard.<br><br>
Booking reference: <strong>${code}</strong>`,
      },
    };

    const tmpl = templates[event];
    return {
      subject: tmpl.subject,
      html: this.wrapEmail(`<p>Hi ${name},</p><p>${tmpl.body}</p>`),
    };
  }

  private wrapEmail(body: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .wrap { max-width: 540px; margin: 32px auto; background: #fff; border: 1px solid #e5e5e5; }
  .top  { background: #fff; padding: 12px 32px; text-align: center; }
  .body { padding: 28px 32px; color: #222; font-size: 14px; line-height: 1.7; }
  .body p { margin: 0 0 16px 0; }
  .body p:last-child { margin-bottom: 0; }
  .foot { padding: 16px 32px; font-size: 11px; color: #aaa; border-top: 1px solid #eee; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="top">${logoHtml()}</div>
    <div style="display:none;max-height:0;overflow:hidden;">${Date.now()}</div>
    <div class="body">${body}</div>
    <div class="foot">Podversal Studio &nbsp;|&nbsp; Reply to this email or call us if you have any questions.</div>
  </div>
</body></html>`;
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = this.wrapEmail(`
      <p>Hi ${name},</p>
      <p>Your account has been created. You're all set to book studio sessions.</p>
      <p>Log in to your Podversal Studio account to book sessions, view invoices, and manage your shoots.</p>
    `);
    return this.send(to, 'Welcome to Podversal Studio', html);
  }

  async sendCredentialsEmail(to: string, name: string, password: string, loginUrl: string, role: string): Promise<void> {
    const html = this.wrapEmail(`
      <p>Hi ${name},</p>
      <p>Your <strong>Podversal Studio</strong> account has been created. Here are your login credentials:</p>
      <table style="border:1px solid #e5e5e5;border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:10px 14px;background:#f9f9f9;font-weight:700;width:40%;">Role</td><td style="padding:10px 14px;">${role}</td></tr>
        <tr><td style="padding:10px 14px;background:#f9f9f9;font-weight:700;">Email</td><td style="padding:10px 14px;">${to}</td></tr>
        <tr><td style="padding:10px 14px;background:#f9f9f9;font-weight:700;">Password</td><td style="padding:10px 14px;">${password}</td></tr>
      </table>
      <p style="margin:0 0 20px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:#E5312A;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;text-decoration:none;">Login Now</a>
      </p>
      <p style="color:#888;font-size:12px;">Please change your password after your first login from Profile → Change Password.</p>
    `);
    return this.send(to, 'Your Podversal Studio account is ready', html);
  }

  async sendRawEmail(to: string, subject: string, html: string): Promise<void> {
    return this.send(to, subject, html);
  }

  // Sends one sample email of every type to `to` so you can verify layout and content
  async sendTestEmails(to: string): Promise<{ sent: string[]; errors: string[] }> {
    const fakebooking = {
      bookingCode:   'BK-20260630-TEST',
      customerName:  'Rahul Mehta',
      customerEmail: to,
      startTime:     '10:00',
      endTime:       '14:00',
      shootDate:     new Date('2026-07-01'),
      totalAmount:   8000,
      advanceAmount: 8000,
      service:       { name: 'Podcast Studio' },
      customer:      null,
      createdBy:     { email: to, name: 'Rahul Mehta' },
    };

    const events: NotificationEvent[] = [
      'BOOKING_CREATED',
      'PAYMENT_RECEIVED',
      'SHOOT_REMINDER',
      'BOOKING_CANCELLED',
      'INVOICE_GENERATED',
    ];

    const sent: string[] = [];
    const errors: string[] = [];

    for (const event of events) {
      try {
        const { subject, html } = this.buildEmail(event, { booking: fakebooking, name: 'Rahul Mehta' });
        await this.send(to, `[TEST] ${subject}`, html);
        sent.push(event);
      } catch (err: any) {
        errors.push(`${event}: ${err?.message ?? 'failed'}`);
      }
    }

    return { sent, errors };
  }

  async sendRawEmail(to: string, subject: string, html: string): Promise<void> {
    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.log(`[Email DEV] To: ${to} | Subject: ${subject}`);
      return;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'podversalstudio@gmail.com';

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
          'api-key':      apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender:      { name: 'Podversal Studio', email: senderEmail },
          to:          [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Brevo ${res.status}: ${err}`);
      }

      console.log(`[Email OK] To: ${to} | Subject: ${subject}`);
    } catch (err: any) {
      console.error(`[Email FAILED] To: ${to} | Subject: ${subject}`);
      console.error(`[Email ERROR] ${err?.message ?? err}`);
      throw err;
    }
  }
}

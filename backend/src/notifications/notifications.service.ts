import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationEvent =
  | 'BOOKING_CREATED'
  | 'QUOTE_SENT'
  | 'BOOKING_APPROVED'
  | 'PAYMENT_RECEIVED'
  | 'SHOOT_REMINDER'
  | 'BOOKING_CANCELLED'
  | 'INVOICE_GENERATED';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   ?? 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendBookingNotification(bookingId: string, event: NotificationEvent) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: {
        service:  true,
        customer: { include: { user: { select: { email: true, name: true } } } },
        createdBy: true,
      },
    });
    if (!booking) return;

    const email = booking.customer?.user?.email ?? booking.createdBy.email;
    const name  = booking.customer?.user?.name  ?? booking.createdBy.name;

    const { subject, html } = this.buildEmail(event, { booking, name });

    // Send to customer
    await this.send(email, subject, html);

    // Notify admin on new booking or payment received
    if (event === 'BOOKING_CREATED' || event === 'PAYMENT_RECEIVED') {
      const adminEmail = process.env.SMTP_USER;
      if (adminEmail && email !== adminEmail) {
        const adminSubject = `[New] ${subject}`;
        const adminHtml = html.replace(
          `<p>Hi <strong>${name}</strong>,</p>`,
          `<p>Hi <strong>Studio Team</strong>,</p><p style="color:#888;font-size:12px;">Customer: ${name} (${email})</p>`,
        );
        await this.send(adminEmail, adminSubject, adminHtml);
      }
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

    const templates: Record<NotificationEvent, { subject: string; body: string }> = {
      BOOKING_CREATED: {
        subject: `Booking Received — ${code}`,
        body:    `Your booking request for <strong>${service}</strong> on <strong>${date}</strong> (${booking.startTime}–${booking.endTime}) has been received. Our team will review and get back to you shortly.`,
      },
      QUOTE_SENT: {
        subject: `Quote Ready — ${code}`,
        body:    `Your quote for <strong>${service}</strong> on <strong>${date}</strong> is ready.<br><br>Total: ₹${Number(booking.totalAmount).toLocaleString('en-IN')}<br>Advance: ₹${Number(booking.advanceAmount).toLocaleString('en-IN')}<br><br>Please approve to confirm your slot.`,
      },
      BOOKING_APPROVED: {
        subject: `Booking Confirmed — ${code}`,
        body:    `Great news! Your booking for <strong>${service}</strong> on <strong>${date}</strong> has been <strong>approved</strong>. Please complete the advance payment to lock your slot.`,
      },
      PAYMENT_RECEIVED: {
        subject: `Payment Received — ${code}`,
        body:    `We've received your payment for booking <strong>${code}</strong>. Your slot is now confirmed for <strong>${date}</strong> (${booking.startTime}–${booking.endTime}).`,
      },
      SHOOT_REMINDER: {
        subject: `Reminder: Shoot Tomorrow — ${code}`,
        body:    `This is a reminder that your <strong>${service}</strong> shoot is scheduled for <strong>${date}</strong> from ${booking.startTime} to ${booking.endTime}.<br><br>Please arrive 10 minutes early.`,
      },
      BOOKING_CANCELLED: {
        subject: `Booking Cancelled — ${code}`,
        body:    `Your booking <strong>${code}</strong> for ${service} on ${date} has been cancelled. If you have any questions, please contact us.`,
      },
      INVOICE_GENERATED: {
        subject: `Invoice Available — ${code}`,
        body:    `Your invoice for booking <strong>${code}</strong> (${service}) has been generated. Please find it attached or in your dashboard.`,
      },
    };

    const tmpl = templates[event];
    return {
      subject: tmpl.subject,
      html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .header  { background: #111; color: #fff; padding: 28px 32px; }
        .header h2 { margin: 0; font-size: 20px; }
        .header p  { margin: 4px 0 0; font-size: 12px; opacity: .6; }
        .body    { padding: 28px 32px; color: #333; line-height: 1.6; font-size: 14px; }
        .footer  { padding: 16px 32px; font-size: 11px; color: #999; border-top: 1px solid #eee; }
      </style></head>
      <body>
        <div class="wrapper">
          <div class="header"><h2>Podversal Studio</h2><p>Professional Studio Management</p></div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>${tmpl.body}</p>
            <p>Thank you for choosing Podversal Studio.</p>
          </div>
          <div class="footer">Podversal Studio • This is an automated message, please do not reply directly.</div>
        </div>
      </body></html>`,
    };
  }

  async sendRawEmail(to: string, subject: string, html: string): Promise<void> {
    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    const smtpConfigured = process.env.SMTP_USER && !process.env.SMTP_USER.includes('your_');
    if (!smtpConfigured) {
      console.log(`[Email DEV] To: ${to} | Subject: ${subject}`);
      return;
    }
    await this.transporter.sendMail({
      from:    process.env.EMAIL_FROM ?? `"Podversal Studio" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  }
}

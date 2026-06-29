import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key:    this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  // ── GENERATE INVOICE ─────────────────────────────────────
  async generate(bookingId: string, type: InvoiceType, requesterId?: string, requesterRole?: string): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, payments: true, customer: { select: { userId: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Customers can only generate invoices for their own bookings
    if (requesterRole === 'CUSTOMER') {
      const owns = booking.createdById === requesterId || booking.customer?.userId === requesterId;
      if (!owns) throw new ForbiddenException('Access denied');
    }

    // Unique invoice number using max existing number (safe under concurrent load)
    const year = new Date().getFullYear();
    const latest = await this.prisma.invoice.findFirst({
      where:   { invoiceNumber: { startsWith: `INV-${year}-` } },
      orderBy: { invoiceNumber: 'desc' },
      select:  { invoiceNumber: true },
    });
    const nextSeq = latest
      ? parseInt(latest.invoiceNumber.split('-')[2], 10) + 1
      : 1;
    const invoiceNumber = `INV-${year}-${String(nextSeq).padStart(4, '0')}`;

    const gstRate  = 0.18;
    const amount   = booking.totalAmount ?? 0;
    const gstAmount = type === InvoiceType.GST_INVOICE ? Math.round(amount * gstRate * 100) / 100 : 0;
    const total    = amount + gstAmount;

    // Generate PDF using pdfkit (no browser required)
    const pdfBuffer = await this.buildInvoicePdf({
      invoiceNumber,
      type,
      booking,
      amount,
      gstAmount,
      total,
    });

    // Upload PDF to Cloudinary
    const cloudinaryUrl = await this.uploadToCloudinary(pdfBuffer, invoiceNumber);

    // Save invoice to DB
    const invoice = await this.prisma.invoice.create({
      data: {
        bookingId,
        type,
        invoiceNumber,
        amount,
        gstAmount,
        totalAmount: total,
        cloudinaryUrl,
      },
    });

    // Auto-email to customer — fire-and-forget so email failure doesn't kill invoice creation
    this.sendInvoiceEmail(booking.customerEmail, booking.customerName, invoiceNumber, cloudinaryUrl, type)
      .catch(err => console.error(`[Invoice Email Failed] ${invoiceNumber}: ${err?.message ?? err}`));

    return invoice;
  }

  // ── STREAM PDF (bypass Cloudinary auth) ─────────────────
  async streamPdf(invoiceId: string, requesterId: string, requesterRole: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          include: {
            service: true,
            customer: { select: { userId: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (requesterRole === 'CUSTOMER') {
      const owns = invoice.booking.createdById === requesterId || invoice.booking.customer?.userId === requesterId;
      if (!owns) throw new ForbiddenException('Access denied');
    }

    const buffer = await this.buildInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      type:          invoice.type,
      booking:       invoice.booking,
      amount:        Number(invoice.amount),
      gstAmount:     Number(invoice.gstAmount ?? 0),
      total:         Number(invoice.totalAmount),
    });

    return { buffer, invoiceNumber: invoice.invoiceNumber };
  }

  // ── LIST BY BOOKING ──────────────────────────────────────
  async findByBooking(bookingId: string, requesterId: string, requesterRole: string) {
    if (requesterRole === 'CUSTOMER') {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: { select: { userId: true } } },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      const owns = booking.createdById === requesterId ||
                   booking.customer?.userId === requesterId;
      if (!owns) throw new ForbiddenException('Access denied');
    }
    return this.prisma.invoice.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── PRIVATE: INVOICE EMAIL HTML ──────────────────────────
  private buildInvoiceEmailHtml(name: string, typeLabel: string, invoiceNumber: string, portalUrl: string): string {
    const logoUrl = process.env.EMAIL_LOGO_URL ?? '';
    const logo    = logoUrl
      ? `<img src="${logoUrl}" alt="Podversal Studio" height="60" style="display:block;margin:0 auto 8px;" />`
      : `<div style="font-size:20px;font-weight:bold;color:#111111;text-align:center;">Podversal Studio</div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f4">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td bgcolor="#ffffff" align="center" style="padding:28px 32px 20px;border-bottom:1px solid #eeeeee;">
          ${logo}
        </td></tr>

        <!-- Body -->
        <tr><td bgcolor="#ffffff" style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#333333;">Hi ${name},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#333333;">
            Your <strong>${typeLabel}</strong> (${invoiceNumber}) has been generated and is ready to download.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td bgcolor="#E5312A" style="border-radius:2px;">
              <a href="${portalUrl}/dashboard/invoices"
                 style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:0.05em;">
                VIEW &amp; DOWNLOAD INVOICE
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#888888;">
            Log in to your Podversal account and go to Invoices to download your PDF.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td bgcolor="#f4f4f4" style="padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaaaaa;">
            Podversal Studio &nbsp;&middot;&nbsp; This is an automated message, please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ── PRIVATE: PDF GENERATION (pdfkit — no browser required) ─
  private buildInvoicePdf(data: {
    invoiceNumber: string;
    type: InvoiceType;
    booking: any;
    amount: number;
    gstAmount: number;
    total: number;
  }): Promise<Buffer> {
    const { invoiceNumber, type, booking, amount, gstAmount, total } = data;

    const typeLabels: Record<InvoiceType, string> = {
      QUOTATION:       'Quotation',
      PROFORMA:        'Proforma Invoice',
      GST_INVOICE:     'Tax Invoice (GST)',
      PAYMENT_RECEIPT: 'Payment Receipt',
    };

    const fmt  = (n: number) => `Rs.${Number(n).toLocaleString('en-IN')}`;
    const W    = 495; // usable width (A4 595 - 50*2 margins)
    const LM   = 50;  // left margin
    const RM   = 545; // right edge

    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ────────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#3b5bdb')
         .text('Podversal Studio', LM, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
         .text(process.env.ADMIN_EMAIL ?? '', LM, 74);

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333')
         .text(typeLabels[type], LM, 50, { width: W, align: 'right' });
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
         .text(`#${invoiceNumber}`, LM, 71, { width: W, align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, LM, 85, { width: W, align: 'right' });

      // ── Divider ───────────────────────────────────────────
      doc.moveTo(LM, 105).lineTo(RM, 105).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // ── Two-column info ───────────────────────────────────
      const C2 = LM + W / 2 + 10;
      let y = 118;

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#999999')
         .text('BILLED TO', LM, y).text('BOOKING DETAILS', C2, y);

      y += 14;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a')
         .text(booking.customerName, LM, y, { width: W / 2 - 10 })
         .text(booking.service?.name ?? 'Studio Session', C2, y, { width: W / 2 - 10 });

      y += 16;
      doc.fontSize(10).font('Helvetica').fillColor('#444444')
         .text(booking.customerEmail, LM, y, { width: W / 2 - 10 })
         .text(`Date: ${new Date(booking.shootDate).toLocaleDateString('en-IN')}`, C2, y, { width: W / 2 - 10 });

      y += 14;
      doc.text(booking.customerPhone ?? '', LM, y, { width: W / 2 - 10 })
         .text(`Time: ${booking.startTime} – ${booking.endTime}`, C2, y, { width: W / 2 - 10 });

      y += 14;
      if (booking.companyName) {
        doc.text(booking.companyName, LM, y, { width: W / 2 - 10 });
      }
      doc.text(`Duration: ${booking.durationHours} hrs`, C2, y, { width: W / 2 - 10 });

      // ── Table header ─────────────────────────────────────
      y += 36;
      doc.rect(LM, y, W, 26).fill('#f3f4f6');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a')
         .text('Description',   LM + 8, y + 8)
         .text('Duration',      LM + 260, y + 8, { width: 70, align: 'right' })
         .text('Rate/Hr',       LM + 340, y + 8, { width: 70, align: 'right' })
         .text('Amount',        LM + 420, y + 8, { width: 68, align: 'right' });

      // ── Table row ────────────────────────────────────────
      y += 26;
      const ratePerHr = booking.durationHours ? amount / booking.durationHours : 0;
      doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a')
         .text(`${booking.service?.name ?? 'Studio'} Session`, LM + 8, y + 8, { width: 250 })
         .text(`${booking.durationHours} hrs`,  LM + 260, y + 8, { width: 70, align: 'right' })
         .text(fmt(ratePerHr),                  LM + 340, y + 8, { width: 70, align: 'right' })
         .text(fmt(amount),                     LM + 420, y + 8, { width: 68, align: 'right' });

      y += 26;
      doc.moveTo(LM, y).lineTo(RM, y).strokeColor('#f3f4f6').lineWidth(1).stroke();

      // ── Discount ─────────────────────────────────────────
      if (booking.discountAmount && booking.discountAmount > 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a')
           .text('Discount', LM + 8, y + 8)
           .fillColor('#dc2626')
           .text(`-${fmt(booking.discountAmount)}`, LM + 420, y + 8, { width: 68, align: 'right' });
        y += 26;
        doc.moveTo(LM, y).lineTo(RM, y).strokeColor('#f3f4f6').lineWidth(1).stroke();
      }

      // ── GST ──────────────────────────────────────────────
      if (gstAmount > 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a')
           .text('GST @ 18%', LM + 8, y + 8)
           .text(fmt(gstAmount), LM + 420, y + 8, { width: 68, align: 'right' });
        y += 26;
        doc.moveTo(LM, y).lineTo(RM, y).strokeColor('#f3f4f6').lineWidth(1).stroke();
      }

      // ── Total ─────────────────────────────────────────────
      doc.rect(LM, y, W, 30).fill('#f9fafb');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a')
         .text('Total Amount', LM + 8, y + 9)
         .text(fmt(total), LM + 420, y + 9, { width: 68, align: 'right' });

      // ── Footer ────────────────────────────────────────────
      const footerY = 770;
      doc.moveTo(LM, footerY).lineTo(RM, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.fontSize(9).font('Helvetica').fillColor('#999999')
         .text(
           'Thank you for choosing Podversal Studio  ·  This is a computer-generated document',
           LM, footerY + 10, { width: W, align: 'center' },
         );

      doc.end();
    });
  }

  // ── PRIVATE: CLOUDINARY UPLOAD ───────────────────────────
  private async uploadToCloudinary(pdfBuffer: Buffer, invoiceNumber: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'podversal/invoices', public_id: invoiceNumber, resource_type: 'raw', format: 'pdf' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      );
      stream.end(pdfBuffer);
    });
  }

  // ── PRIVATE: EMAIL (Brevo API) ───────────────────────────
  private async sendInvoiceEmail(
    to: string,
    name: string,
    invoiceNumber: string,
    pdfUrl: string,
    type: InvoiceType,
  ) {
    const subjects: Record<InvoiceType, string> = {
      QUOTATION:       `Quotation from Podversal Studio (${invoiceNumber})`,
      PROFORMA:        `Proforma Invoice (${invoiceNumber})`,
      GST_INVOICE:     `Tax Invoice (${invoiceNumber})`,
      PAYMENT_RECEIPT: `Payment Receipt (${invoiceNumber})`,
    };

    const apiKey = this.config.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      console.log(`[Email DEV] To: ${to} | Subject: ${subjects[type]}`);
      return;
    }

    const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL') ?? 'podversalstudio@gmail.com';
    const portalUrl   = (this.config.get<string>('FRONTEND_URL') ?? 'https://podversal.com').split(',')[0].trim();
    const typeLabel   = subjects[type].split('(')[0].trim();
    const html = this.buildInvoiceEmailHtml(name, typeLabel, invoiceNumber, portalUrl);

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'Podversal Studio', email: senderEmail },
        to:          [{ email: to, name }],
        subject:     subjects[type],
        htmlContent: html,
      }),
    });

    if (res.ok) {
      await this.prisma.invoice.updateMany({
        where: { invoiceNumber },
        data:  { emailSentAt: new Date() },
      });
    } else {
      console.error(`[Invoice Email Failed] ${invoiceNumber}: ${await res.text()}`);
    }
  }
}

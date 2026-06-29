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

    const gstRate   = 0.18;
    const amount    = booking.totalAmount ?? 0;
    const gstAmount = Math.round(amount * gstRate * 100) / 100;
    const total     = amount + gstAmount;

    // Generate PDF using pdfkit (no browser required)
    const logoBuffer = await this.fetchLogoBuffer();
    const pdfBuffer = await this.buildInvoicePdf({
      invoiceNumber,
      type,
      booking,
      amount,
      gstAmount,
      total,
      logoBuffer,
    });

    // Save invoice to DB (PDF streamed on-demand via /invoices/:id/pdf — no Cloudinary upload needed)
    const invoice = await this.prisma.invoice.create({
      data: {
        bookingId,
        type,
        invoiceNumber,
        amount,
        gstAmount,
        totalAmount: total,
      },
    });

    // Auto-email to customer — fire-and-forget so email failure doesn't kill invoice creation
    this.sendInvoiceEmail(booking.customerEmail, booking.customerName, invoiceNumber, pdfBuffer, type)
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

    const logoBuffer = await this.fetchLogoBuffer();
    const buffer = await this.buildInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      type:          invoice.type,
      booking:       invoice.booking,
      amount:        Number(invoice.amount),
      gstAmount:     Number(invoice.gstAmount ?? 0),
      total:         Number(invoice.totalAmount),
      logoBuffer,
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
  private buildInvoiceEmailHtml(name: string, typeLabel: string, invoiceNumber: string): string {
    const logoUrl = process.env.EMAIL_LOGO_URL ?? '';
    const logo    = logoUrl
      ? `<img src="${logoUrl}" alt="Podversal Studio" height="150" style="display:block;margin:0 auto;border:0;" />`
      : `<span style="color:#E5312A;font-size:20px;font-weight:900;letter-spacing:0.08em;">PODVERSAL STUDIO</span>`;

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
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
    <div class="top" bgcolor="#ffffff">${logo}</div>
    <div class="body">
      <p>Hi ${name},</p>
      <p>Your <strong>${typeLabel}</strong> (<strong>${invoiceNumber}</strong>) has been generated.</p>
      <p>Please find your invoice PDF attached to this email.</p>
      <p>If you have any questions, please contact us at podversalstudio@gmail.com.</p>
    </div>
    <div class="foot">Podversal Studio &nbsp;|&nbsp; Reply to this email or call us if you have any questions.</div>
  </div>
</body></html>`;
  }

  // ── PRIVATE: LOGO FETCH (cached in memory after first load) ─
  private _logoCache: Buffer | null | undefined = undefined;

  private async fetchLogoBuffer(): Promise<Buffer | null> {
    if (this._logoCache !== undefined) return this._logoCache;
    const logoUrl = this.config.get<string>('EMAIL_LOGO_URL');
    if (!logoUrl) { this._logoCache = null; return null; }
    try {
      const res = await fetch(logoUrl);
      this._logoCache = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    } catch {
      this._logoCache = null;
    }
    return this._logoCache;
  }

  // ── PRIVATE: PDF GENERATION (pdfkit — no browser required) ─
  private buildInvoicePdf(data: {
    invoiceNumber: string;
    type: InvoiceType;
    booking: any;
    amount: number;
    gstAmount: number;
    total: number;
    logoBuffer?: Buffer | null;
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
      const GSTIN = '09AAMCK1657J1Z2';
      const ADDR  = 'B 812, 814, Tower 4, NX One, Greater Noida West, UP';
      const UNIT  = 'A Unit of Krishiyug Technologies Pvt. Ltd.';
      const EMAIL = process.env.ADMIN_EMAIL ?? 'podversalstudio@gmail.com';

      let headerBottom: number;
      if (data.logoBuffer) {
        doc.image(data.logoBuffer, LM, 25, { width: 120 });
        doc.fontSize(8).font('Helvetica').fillColor('#666666')
           .text(UNIT,            LM, 148)
           .text(ADDR,            LM, 160)
           .text(`GSTIN: ${GSTIN}`, LM, 172)
           .text(EMAIL,           LM, 184);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333')
           .text(typeLabels[type], LM, 38, { width: W, align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor('#666666')
           .text(`#${invoiceNumber}`, LM, 60, { width: W, align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, LM, 74, { width: W, align: 'right' });
        doc.moveTo(LM, 200).lineTo(RM, 200).strokeColor('#e5e7eb').lineWidth(1).stroke();
        headerBottom = 214;
      } else {
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#3b5bdb')
           .text('Podversal Studio', LM, 50);
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
           .text(UNIT, LM, 74);
        doc.fontSize(8).fillColor('#888888')
           .text(ADDR,            LM, 86)
           .text(`GSTIN: ${GSTIN}`, LM, 97)
           .text(EMAIL,           LM, 108);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#333333')
           .text(typeLabels[type], LM, 50, { width: W, align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor('#666666')
           .text(`#${invoiceNumber}`, LM, 71, { width: W, align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, LM, 85, { width: W, align: 'right' });
        doc.moveTo(LM, 122).lineTo(RM, 122).strokeColor('#e5e7eb').lineWidth(1).stroke();
        headerBottom = 135;
      }

      // ── Two-column info ───────────────────────────────────
      const C2 = LM + W / 2 + 10;
      let y = headerBottom;

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

  // ── PRIVATE: EMAIL (Brevo API — with PDF attachment) ────
  private async sendInvoiceEmail(
    to: string,
    name: string,
    invoiceNumber: string,
    pdfBuffer: Buffer,
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
    const typeLabel   = subjects[type].split('(')[0].trim();
    const html = this.buildInvoiceEmailHtml(name, typeLabel, invoiceNumber);

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'Podversal Studio', email: senderEmail },
        to:          [{ email: to, name }],
        subject:     subjects[type],
        htmlContent: html,
        attachment:  [{ content: pdfBuffer.toString('base64'), name: `${invoiceNumber}.pdf` }],
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

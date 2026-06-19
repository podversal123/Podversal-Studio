import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key:    this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });

    // Configure Nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  // ── GENERATE INVOICE ─────────────────────────────────────
  async generate(bookingId: string, type: InvoiceType): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, payments: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Auto-increment invoice number: INV-2026-0001
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const gstRate  = 0.18;
    const amount   = booking.totalAmount ?? 0;
    const gstAmount = type === InvoiceType.GST_INVOICE ? Math.round(amount * gstRate * 100) / 100 : 0;
    const total    = amount + gstAmount;

    // Generate PDF HTML
    const html = this.buildInvoiceHtml({
      invoiceNumber,
      type,
      booking,
      amount,
      gstAmount,
      total,
    });

    // Convert HTML → PDF using Puppeteer
    const pdfBuffer = await this.generatePdf(html);

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

    // Auto-email to customer
    await this.sendInvoiceEmail(booking.customerEmail, booking.customerName, invoiceNumber, cloudinaryUrl, type);

    return invoice;
  }

  // ── LIST BY BOOKING ──────────────────────────────────────
  findByBooking(bookingId: string) {
    return this.prisma.invoice.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── PRIVATE: BUILD HTML ──────────────────────────────────
  private buildInvoiceHtml(data: {
    invoiceNumber: string;
    type: InvoiceType;
    booking: any;
    amount: number;
    gstAmount: number;
    total: number;
  }): string {
    const { invoiceNumber, type, booking, amount, gstAmount, total } = data;
    const typeLabels: Record<InvoiceType, string> = {
      QUOTATION:       'Quotation',
      PROFORMA:        'Proforma Invoice',
      GST_INVOICE:     'Tax Invoice (GST)',
      PAYMENT_RECEIPT: 'Payment Receipt',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #3b5bdb; }
    .invoice-type { font-size: 20px; font-weight: bold; color: #333; text-align: right; }
    .invoice-no { color: #666; font-size: 14px; margin-top: 4px; }
    .divider { border: none; border-top: 2px solid #e5e7eb; margin: 20px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .label { font-size: 12px; color: #666; margin-bottom: 2px; }
    .value { font-size: 14px; color: #1a1a1a; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .total-row td { font-weight: bold; background: #f9fafb; font-size: 14px; }
    .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Podversal Studio</div>
      <div style="font-size:13px;color:#666;margin-top:4px;">studio@podversal.com</div>
    </div>
    <div style="text-align:right;">
      <div class="invoice-type">${typeLabels[type]}</div>
      <div class="invoice-no">#${invoiceNumber}</div>
      <div class="invoice-no">Date: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>

  <hr class="divider" />

  <div class="grid">
    <div>
      <div class="label">Billed To</div>
      <div class="value">${booking.customerName}</div>
      <div style="font-size:13px;color:#666;">${booking.customerEmail}</div>
      <div style="font-size:13px;color:#666;">${booking.customerPhone}</div>
      ${booking.companyName ? `<div style="font-size:13px;color:#666;">${booking.companyName}</div>` : ''}
    </div>
    <div>
      <div class="label">Booking Details</div>
      <div class="value">${booking.service?.name}</div>
      <div style="font-size:13px;color:#666;">Date: ${new Date(booking.shootDate).toLocaleDateString('en-IN')}</div>
      <div style="font-size:13px;color:#666;">Time: ${booking.startTime} – ${booking.endTime}</div>
      <div style="font-size:13px;color:#666;">Duration: ${booking.durationHours} hours</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Duration</th>
        <th>Rate/Hr</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${booking.service?.name} Studio Session</td>
        <td>${booking.durationHours} hrs</td>
        <td>₹${((amount / booking.durationHours) || 0).toLocaleString('en-IN')}</td>
        <td>₹${amount.toLocaleString('en-IN')}</td>
      </tr>
      ${booking.discountAmount > 0 ? `
      <tr>
        <td colspan="3">Discount</td>
        <td>-₹${booking.discountAmount.toLocaleString('en-IN')}</td>
      </tr>` : ''}
      ${gstAmount > 0 ? `
      <tr>
        <td colspan="3">GST @ 18%</td>
        <td>₹${gstAmount.toLocaleString('en-IN')}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3">Total Amount</td>
        <td>₹${total.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Thank you for choosing Podversal Studio · This is a computer-generated document
  </div>
</body>
</html>`;
  }

  // ── PRIVATE: PDF GENERATION ──────────────────────────────
  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
    await browser.close();
    return Buffer.from(pdf);
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

  // ── PRIVATE: EMAIL ───────────────────────────────────────
  private async sendInvoiceEmail(
    to: string,
    name: string,
    invoiceNumber: string,
    pdfUrl: string,
    type: InvoiceType,
  ) {
    const subjects: Record<InvoiceType, string> = {
      QUOTATION:       `Quotation from Podversal Studio — ${invoiceNumber}`,
      PROFORMA:        `Proforma Invoice — ${invoiceNumber}`,
      GST_INVOICE:     `Tax Invoice — ${invoiceNumber}`,
      PAYMENT_RECEIPT: `Payment Receipt — ${invoiceNumber}`,
    };

    // Skip actual email in development
    if (this.config.get('NODE_ENV') !== 'production') {
      console.log(`[DEV EMAIL] Would send "${subjects[type]}" to ${to}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get('EMAIL_FROM'),
      to,
      subject: subjects[type],
      html: `<p>Dear ${name},</p><p>Please find your document attached: <a href="${pdfUrl}">Download PDF</a></p><p>Thank you,<br/>Podversal Studio</p>`,
    });

    await this.prisma.invoice.updateMany({
      where: { invoiceNumber },
      data: { emailSentAt: new Date() },
    });
  }
}

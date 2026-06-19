import { Injectable } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getBookingReport(from: string, to: string) {
    const start = new Date(from);
    const end   = new Date(to);
    end.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        service:  { select: { name: true, type: true } },
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        payments: { where: { status: PaymentStatus.PAID }, select: { amount: true, type: true, mode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total:      bookings.length,
      completed:  bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
      cancelled:  bookings.filter(b => b.status === BookingStatus.CANCELLED).length,
      inProgress: bookings.filter(b => b.status === BookingStatus.IN_PROGRESS).length,
    };

    return { summary, bookings };
  }

  async getRevenueReport(from: string, to: string) {
    const start = new Date(from);
    const end   = new Date(to);
    end.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PAID, paidAt: { gte: start, lte: end } },
      include: {
        booking: {
          select: {
            bookingCode: true,
            shootDate:   true,
            service:     { select: { name: true, type: true } },
            customer:    { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const byMode = payments.reduce((acc, p) => {
      acc[p.mode] = (acc[p.mode] ?? 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>);

    return { totalRevenue, byMode, payments };
  }

  async getGstReport(from: string, to: string) {
    const start = new Date(from);
    const end   = new Date(to);
    end.setHours(23, 59, 59, 999);

    const invoices = await this.prisma.invoice.findMany({
      where: { type: 'GST_INVOICE', createdAt: { gte: start, lte: end } },
      include: {
        booking: {
          select: {
            bookingCode: true,
            service:     { select: { name: true } },
            customer:    { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalTaxable = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalGst     = invoices.reduce((sum, inv) => sum + Number(inv.gstAmount ?? 0), 0);
    const totalAmount  = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return { totalTaxable, totalGst, totalAmount, invoices };
  }

  async exportBookingReportPdf(from: string, to: string): Promise<Buffer> {
    const { summary, bookings } = await this.getBookingReport(from, to);

    const rows = bookings.map(b => `
      <tr>
        <td>${b.bookingCode}</td>
        <td>${b.service.name}</td>
        <td>${b.customer?.user?.name ?? b.customerName}</td>
        <td>${new Date(b.shootDate).toLocaleDateString('en-IN')}</td>
        <td>${b.startTime} - ${b.endTime}</td>
        <td><span class="status ${b.status.toLowerCase()}">${b.status}</span></td>
        <td>₹${Number(b.totalAmount ?? 0).toLocaleString('en-IN')}</td>
      </tr>`).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #1a1a1a; font-size: 22px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 24px; }
        .stat { background: #f4f4f4; padding: 12px 20px; border-radius: 6px; }
        .stat .val { font-size: 22px; font-weight: bold; color: #111; }
        .stat .lbl { font-size: 11px; color: #888; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #111; color: #fff; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #fafafa; }
        .status { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
        .completed { background: #d1fae5; color: #065f46; }
        .cancelled  { background: #fee2e2; color: #991b1b; }
        .in_progress { background: #dbeafe; color: #1e40af; }
      </style>
    </head>
    <body>
      <h1>Podversal Studio — Booking Report</h1>
      <div class="meta">Period: ${from} to ${to} | Generated: ${new Date().toLocaleString('en-IN')}</div>
      <div class="summary">
        <div class="stat"><div class="val">${summary.total}</div><div class="lbl">Total</div></div>
        <div class="stat"><div class="val">${summary.completed}</div><div class="lbl">Completed</div></div>
        <div class="stat"><div class="val">${summary.inProgress}</div><div class="lbl">In Progress</div></div>
        <div class="stat"><div class="val">${summary.cancelled}</div><div class="lbl">Cancelled</div></div>
      </div>
      <table>
        <thead><tr><th>Code</th><th>Service</th><th>Customer</th><th>Date</th><th>Slot</th><th>Status</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    return this.generatePdf(html);
  }

  async exportRevenueReportPdf(from: string, to: string): Promise<Buffer> {
    const { totalRevenue, byMode, payments } = await this.getRevenueReport(from, to);

    const modeRows = Object.entries(byMode).map(([mode, amt]) =>
      `<tr><td>${mode}</td><td>₹${Number(amt).toLocaleString('en-IN')}</td></tr>`).join('');

    const payRows = payments.map(p => `
      <tr>
        <td>${p.booking.bookingCode}</td>
        <td>${p.booking.customer?.user?.name ?? '—'}</td>
        <td>${p.booking.service.name}</td>
        <td>${p.type}</td>
        <td>${p.mode}</td>
        <td>₹${Number(p.amount).toLocaleString('en-IN')}</td>
        <td>${p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '-'}</td>
      </tr>`).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #1a1a1a; font-size: 22px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
        .total-box { background: #111; color: #fff; display: inline-block; padding: 16px 32px; border-radius: 8px; margin-bottom: 20px; }
        .total-box .val { font-size: 28px; font-weight: bold; }
        .total-box .lbl { font-size: 12px; opacity: 0.7; }
        h3 { font-size: 15px; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #111; color: #fff; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <h1>Podversal Studio — Revenue Report</h1>
      <div class="meta">Period: ${from} to ${to} | Generated: ${new Date().toLocaleString('en-IN')}</div>
      <div class="total-box">
        <div class="val">₹${totalRevenue.toLocaleString('en-IN')}</div>
        <div class="lbl">Total Revenue Collected</div>
      </div>
      <h3>Revenue by Payment Mode</h3>
      <table><thead><tr><th>Mode</th><th>Amount</th></tr></thead><tbody>${modeRows}</tbody></table>
      <h3>All Payments</h3>
      <table>
        <thead><tr><th>Booking</th><th>Customer</th><th>Service</th><th>Type</th><th>Mode</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>${payRows}</tbody>
      </table>
    </body>
    </html>`;

    return this.generatePdf(html);
  }

  async exportGstReportPdf(from: string, to: string): Promise<Buffer> {
    const { totalTaxable, totalGst, totalAmount, invoices } = await this.getGstReport(from, to);

    const rows = invoices.map(inv => `
      <tr>
        <td>${inv.invoiceNumber}</td>
        <td>${inv.booking.bookingCode}</td>
        <td>${inv.booking.customer?.user?.name ?? '—'}</td>
        <td>${inv.booking.service.name}</td>
        <td>₹${Number(inv.amount).toLocaleString('en-IN')}</td>
        <td>18%</td>
        <td>₹${Number(inv.gstAmount ?? 0).toLocaleString('en-IN')}</td>
        <td>₹${Number(inv.totalAmount).toLocaleString('en-IN')}</td>
        <td>${new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>`).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { font-size: 22px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 24px; }
        .stat { background: #f4f4f4; padding: 12px 20px; border-radius: 6px; }
        .stat .val { font-size: 20px; font-weight: bold; }
        .stat .lbl { font-size: 11px; color: #888; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #111; color: #fff; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <h1>Podversal Studio — GST Report</h1>
      <div class="meta">Period: ${from} to ${to} | Generated: ${new Date().toLocaleString('en-IN')}</div>
      <div class="summary">
        <div class="stat"><div class="val">₹${totalTaxable.toLocaleString('en-IN')}</div><div class="lbl">Taxable Amount</div></div>
        <div class="stat"><div class="val">₹${totalGst.toLocaleString('en-IN')}</div><div class="lbl">GST Collected (18%)</div></div>
        <div class="stat"><div class="val">₹${totalAmount.toLocaleString('en-IN')}</div><div class="lbl">Total with GST</div></div>
      </div>
      <table>
        <thead><tr><th>Invoice#</th><th>Booking</th><th>Customer</th><th>Service</th><th>Subtotal</th><th>GST%</th><th>GST Amt</th><th>Total</th><th>Date</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    return this.generatePdf(html);
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

import { Injectable } from "@nestjs/common";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import PDFDocument from "pdfkit";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getBookingReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        service: { select: { name: true, type: true } },
        customer: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        payments: {
          where: { status: PaymentStatus.PAID },
          select: { amount: true, type: true, mode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: bookings.length,
      completed: bookings.filter((b) => b.status === BookingStatus.COMPLETED)
        .length,
      cancelled: bookings.filter((b) => b.status === BookingStatus.CANCELLED)
        .length,
      inProgress: bookings.filter((b) => b.status === BookingStatus.IN_PROGRESS)
        .length,
    };

    return { summary, bookings };
  }

  async getRevenueReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PAID, paidAt: { gte: start, lte: end } },
      include: {
        booking: {
          select: {
            bookingCode: true,
            shootDate: true,
            service: { select: { name: true, type: true } },
            customer: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const byMode = payments.reduce(
      (acc, p) => {
        acc[p.mode] = (acc[p.mode] ?? 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return { totalRevenue, byMode, payments };
  }

  async getGstReport(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const invoices = await this.prisma.invoice.findMany({
      where: { type: "GST_INVOICE", createdAt: { gte: start, lte: end } },
      include: {
        booking: {
          select: {
            bookingCode: true,
            service: { select: { name: true } },
            customer: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalTaxable = invoices.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );
    const totalGst = invoices.reduce(
      (sum, inv) => sum + Number(inv.gstAmount ?? 0),
      0,
    );
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    return { totalTaxable, totalGst, totalAmount, invoices };
  }

  async exportBookingReportPdf(from: string, to: string): Promise<Buffer> {
    const { summary, bookings } = await this.getBookingReport(from, to);
    const fmt = (n: number) => `Rs.${Number(n).toLocaleString("en-IN")}`;
    return this.buildReportPdf({
      title: "Booking Report",
      period: `${from} to ${to}`,
      stats: [
        { label: "Total", value: String(summary.total) },
        { label: "Completed", value: String(summary.completed) },
        { label: "In Progress", value: String(summary.inProgress) },
        { label: "Cancelled", value: String(summary.cancelled) },
      ],
      sections: [
        {
          columns: [
            "Code",
            "Service",
            "Customer",
            "Date",
            "Slot",
            "Status",
            "Amount",
          ],
          rows: bookings.map((b: any) => [
            b.bookingCode,
            b.service.name,
            b.customer?.user?.name ?? b.customerName,
            new Date(b.shootDate).toLocaleDateString("en-IN"),
            `${b.startTime} - ${b.endTime}`,
            b.status,
            fmt(b.totalAmount ?? 0),
          ]),
        },
      ],
    });
  }

  async exportRevenueReportPdf(from: string, to: string): Promise<Buffer> {
    const { totalRevenue, byMode, payments } = await this.getRevenueReport(
      from,
      to,
    );
    const fmt = (n: number) => `Rs.${Number(n).toLocaleString("en-IN")}`;
    return this.buildReportPdf({
      title: "Revenue Report",
      period: `${from} to ${to}`,
      stats: [{ label: "Total Revenue", value: fmt(totalRevenue) }],
      sections: [
        {
          heading: "Revenue by Payment Mode",
          columns: ["Mode", "Amount"],
          rows: Object.entries(byMode).map(([mode, amt]) => [
            mode,
            fmt(amt as number),
          ]),
        },
        {
          heading: "All Payments",
          columns: [
            "Booking",
            "Customer",
            "Service",
            "Type",
            "Mode",
            "Amount",
            "Date",
          ],
          rows: payments.map((p: any) => [
            p.booking.bookingCode,
            p.booking.customer?.user?.name ?? "",
            p.booking.service.name,
            p.type,
            p.mode,
            fmt(p.amount),
            p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "",
          ]),
        },
      ],
    });
  }

  async exportGstReportPdf(from: string, to: string): Promise<Buffer> {
    const { totalTaxable, totalGst, totalAmount, invoices } =
      await this.getGstReport(from, to);
    const fmt = (n: number) => `Rs.${Number(n).toLocaleString("en-IN")}`;
    return this.buildReportPdf({
      title: "GST Report",
      period: `${from} to ${to}`,
      stats: [
        { label: "Taxable Amount", value: fmt(totalTaxable) },
        { label: "GST Collected", value: fmt(totalGst) },
        { label: "Total with GST", value: fmt(totalAmount) },
      ],
      sections: [
        {
          columns: [
            "Invoice#",
            "Booking",
            "Customer",
            "Service",
            "Subtotal",
            "GST%",
            "GST Amt",
            "Total",
            "Date",
          ],
          rows: invoices.map((inv: any) => [
            inv.invoiceNumber,
            inv.booking.bookingCode,
            inv.booking.customer?.user?.name ?? "",
            inv.booking.service.name,
            fmt(inv.amount),
            "18%",
            fmt(inv.gstAmount ?? 0),
            fmt(inv.totalAmount),
            new Date(inv.createdAt).toLocaleDateString("en-IN"),
          ]),
        },
      ],
    });
  }

  private buildReportPdf(opts: {
    title: string;
    period: string;
    stats?: { label: string; value: string }[];
    sections: { heading?: string; columns: string[]; rows: string[][] }[];
  }): Promise<Buffer> {
    const LM = 40;
    const W = 515; // A4 595 - 80 margins
    const RM = LM + W;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Header ────────────────────────────────────────────
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor("#1a1a1a")
        .text(`Podversal Studio  ${opts.title}`, LM, 40);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(
          `Period: ${opts.period}  |  Generated: ${new Date().toLocaleString("en-IN")}`,
          LM,
          63,
        );

      doc
        .moveTo(LM, 80)
        .lineTo(RM, 80)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();

      let y = 92;

      // ── Stats ────────────────────────────────────────────
      if (opts.stats?.length) {
        const cardW = Math.min(
          120,
          (W - (opts.stats.length - 1) * 10) / opts.stats.length,
        );
        opts.stats.forEach((s, i) => {
          const cx = LM + i * (cardW + 10);
          doc.rect(cx, y, cardW, 44).fill("#f4f4f4");
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#111111")
            .text(s.value, cx + 4, y + 6, {
              width: cardW - 8,
              align: "center",
            });
          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#888888")
            .text(s.label, cx + 4, y + 26, {
              width: cardW - 8,
              align: "center",
            });
        });
        y += 60;
      }

      // ── Sections with tables ──────────────────────────────
      for (const section of opts.sections) {
        if (section.heading) {
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#1a1a1a")
            .text(section.heading, LM, y);
          y += 18;
        }

        const cols = section.columns;
        const colW = W / cols.length;

        // Table header
        doc.rect(LM, y, W, 22).fill("#111111");
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
        cols.forEach((col, i) =>
          doc.text(col, LM + i * colW + 4, y + 7, { width: colW - 8 }),
        );

        // Table rows
        for (const [ri, row] of section.rows.entries()) {
          y += 22;
          if (y > 780) {
            doc.addPage();
            y = 40;
          }
          if (ri % 2 === 1) doc.rect(LM, y, W, 20).fill("#fafafa");
          doc.fontSize(8).font("Helvetica").fillColor("#333333");
          row.forEach((cell, i) =>
            doc.text(String(cell ?? ""), LM + i * colW + 4, y + 6, {
              width: colW - 8,
            }),
          );
        }

        y += 30;
      }

      doc.end();
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus, Role } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

export class CreateAgentDto {
  @IsString() name: string;
  @IsString() email: string;
  @IsString() @IsOptional() password?: string;
  @IsString() agencyName: string;
  @IsNumber() @Min(0) @Max(100) commissionRate: number;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() gstNumber?: string;
  @IsString() @IsOptional() bankAccountNo?: string;
  @IsString() @IsOptional() bankIfscCode?: string;
}

export class UpdateAgentDto {
  @IsString() @IsOptional() agencyName?: string;
  @IsNumber() @Min(0) @Max(100) @IsOptional() commissionRate?: number;
  @IsString() @IsOptional() gstNumber?: string;
  @IsString() @IsOptional() bankAccountNo?: string;
  @IsString() @IsOptional() bankIfscCode?: string;
}

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private notifications: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.agent.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { bookings: true, commissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        bookings: {
          include: { service: { select: { name: true } } },
          orderBy: { shootDate: 'desc' },
          take: 10,
        },
        commissions: {
          include: {
            booking: {
              select: {
                bookingCode: true,
                shootDate:   true,
                service:     { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async create(dto: CreateAgentDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    if (dto.phone) {
      const phoneInUse = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (phoneInUse) throw new BadRequestException('Phone number already registered');
    }

    const user = await this.users.create({
      name:     dto.name,
      email:    dto.email,
      phone:    dto.phone || undefined,
      password: dto.password,
      role:     Role.REFERRAL_AGENT,
    });

    const agent = await this.prisma.agent.create({
      data: {
        userId:         user.id,
        agencyName:     dto.agencyName,
        commissionRate: dto.commissionRate,
        gstNumber:      dto.gstNumber,
        bankAccountNo:  dto.bankAccountNo,
        bankIfscCode:   dto.bankIfscCode,
      },
    });

    if (dto.password) {
      const loginUrl = `${process.env.FRONTEND_URL?.split(',')[0]}/agent/login`;
      this.notifications.sendCredentialsEmail(dto.email, dto.name, dto.password, loginUrl, 'Referral Agent').catch(() => {});
    }

    return agent;
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    return this.prisma.agent.update({ where: { id }, data: dto });
  }

  // Release (pay) a pending commission
  async releaseCommission(commissionId: string) {
    const commission = await this.prisma.commission.findUnique({ where: { id: commissionId } });
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status === CommissionStatus.RELEASED) {
      throw new BadRequestException('Commission already released');
    }
    return this.prisma.commission.update({
      where: { id: commissionId },
      data: { status: CommissionStatus.RELEASED, releasedAt: new Date() },
    });
  }

  // Summary: total earned, total pending, total released
  async getCommissionSummary(agentId: string) {
    const [totalAgg, pendingAgg, releasedAgg, count] = await Promise.all([
      this.prisma.commission.aggregate({ where: { agentId }, _sum: { commissionAmount: true } }),
      this.prisma.commission.aggregate({ where: { agentId, status: CommissionStatus.PENDING }, _sum: { commissionAmount: true } }),
      this.prisma.commission.aggregate({ where: { agentId, status: CommissionStatus.RELEASED }, _sum: { commissionAmount: true } }),
      this.prisma.commission.count({ where: { agentId } }),
    ]);
    return {
      total:    totalAgg._sum.commissionAmount    ?? 0,
      pending:  pendingAgg._sum.commissionAmount  ?? 0,
      released: releasedAgg._sum.commissionAmount ?? 0,
      count,
    };
  }

  // Generate PDF commission statement for an agent
  async generateCommissionStatement(agentId: string): Promise<Buffer> {
    const agent   = await this.findOne(agentId);
    const summary = await this.getCommissionSummary(agentId);
    return this.buildStatementPdf(agent, summary);
  }

  private buildStatementPdf(agent: any, summary: any): Promise<Buffer> {
    const fmt  = (n: number) => `Rs.${Number(n).toLocaleString('en-IN')}`;
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const LM   = 50;
    const W    = 495;
    const RM   = 545;

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

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#111111')
         .text('Commission Statement', LM, 50, { width: W, align: 'right' });
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
         .text(`Generated: ${date}`, LM, 71, { width: W, align: 'right' });

      doc.moveTo(LM, 95).lineTo(RM, 95).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // ── Agent info ────────────────────────────────────────
      let y = 110;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a1a')
         .text(agent.user?.name ?? 'Agent', LM, y);
      y += 16;
      doc.fontSize(10).font('Helvetica').fillColor('#444444')
         .text(`Agency: ${agent.agencyName ?? '—'}`, LM, y);
      y += 13;
      doc.text(`Commission Rate: ${agent.commissionRate}%`, LM, y);
      if (agent.gstNumber) { y += 13; doc.text(`GST: ${agent.gstNumber}`, LM, y); }
      if (agent.user?.email) { y += 13; doc.text(`Email: ${agent.user.email}`, LM, y); }

      // ── Summary cards ─────────────────────────────────────
      y += 28;
      const cardW = (W - 20) / 3;
      const cards = [
        { label: 'Total Earned',   value: fmt(summary.total),    color: '#1a1a1a', border: '#e5e7eb' },
        { label: 'Pending Payout', value: fmt(summary.pending),  color: '#d97706', border: '#fde68a' },
        { label: 'Released',       value: fmt(summary.released), color: '#16a34a', border: '#bbf7d0' },
      ];
      cards.forEach((card, i) => {
        const cx = LM + i * (cardW + 10);
        doc.rect(cx, y, cardW, 52).fillAndStroke('#f9fafb', card.border);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(card.color)
           .text(card.value, cx, y + 10, { width: cardW, align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
           .text(card.label, cx, y + 30, { width: cardW, align: 'center' });
      });

      // ── Table ─────────────────────────────────────────────
      y += 68;
      const cols = [
        { label: 'Booking',  x: LM + 4,   w: 70  },
        { label: 'Service',  x: LM + 78,  w: 90  },
        { label: 'Date',     x: LM + 172, w: 62  },
        { label: 'Amount',   x: LM + 238, w: 62  },
        { label: 'Rate',     x: LM + 304, w: 40  },
        { label: 'Comm.',    x: LM + 348, w: 62  },
        { label: 'Status',   x: LM + 414, w: 50  },
        { label: 'Released', x: LM + 468, w: 72  },
      ];

      doc.rect(LM, y, W, 24).fill('#3b5bdb');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      cols.forEach(col => doc.text(col.label, col.x, y + 8, { width: col.w }));

      const commissions: any[] = agent.commissions ?? [];
      if (commissions.length === 0) {
        y += 24;
        doc.rect(LM, y, W, 26).fill('#f9fafb');
        doc.fontSize(10).font('Helvetica').fillColor('#999999')
           .text('No commissions yet', LM, y + 8, { width: W, align: 'center' });
      } else {
        commissions.forEach((c: any, idx: number) => {
          y += 24;
          if (idx % 2 === 1) doc.rect(LM, y, W, 24).fill('#f9fafb');
          doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
          const statusColor = c.status === 'RELEASED' ? '#16a34a' : '#d97706';
          doc.text(c.booking?.bookingCode ?? '—',                                            cols[0].x, y + 7, { width: cols[0].w });
          doc.text(c.booking?.service?.name ?? '—',                                          cols[1].x, y + 7, { width: cols[1].w });
          doc.text(c.booking?.shootDate ? new Date(c.booking.shootDate).toLocaleDateString('en-IN') : '—', cols[2].x, y + 7, { width: cols[2].w });
          doc.text(fmt(c.bookingAmount),                                                      cols[3].x, y + 7, { width: cols[3].w });
          doc.text(`${Number(c.commissionRate).toFixed(1)}%`,                                 cols[4].x, y + 7, { width: cols[4].w });
          doc.text(fmt(c.commissionAmount),                                                   cols[5].x, y + 7, { width: cols[5].w });
          doc.fillColor(statusColor).text(c.status,                                          cols[6].x, y + 7, { width: cols[6].w });
          doc.fillColor('#1a1a1a').text(c.releasedAt ? new Date(c.releasedAt).toLocaleDateString('en-IN') : '—', cols[7].x, y + 7, { width: cols[7].w });
        });
      }

      // ── Footer ────────────────────────────────────────────
      const footerY = 775;
      doc.moveTo(LM, footerY).lineTo(RM, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.fontSize(9).font('Helvetica').fillColor('#999999')
         .text(`Podversal Studio  ·  Computer-generated commission statement  ·  ${date}`,
               LM, footerY + 8, { width: W, align: 'center' });

      doc.end();
    });
  }
}

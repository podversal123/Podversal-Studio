import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus, Role } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import * as puppeteer from 'puppeteer';
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
    const agent = await this.findOne(agentId);
    const summary = await this.getCommissionSummary(agentId);
    const html = this.buildStatementHtml(agent, summary);
    return this.renderPdf(html);
  }

  private buildStatementHtml(agent: any, summary: any): string {
    const fmt  = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const rows = (agent.commissions ?? []).map((c: any) => `
      <tr>
        <td>${c.booking?.bookingCode ?? '—'}</td>
        <td>${c.booking?.service?.name ?? '—'}</td>
        <td>${c.booking?.shootDate ? new Date(c.booking.shootDate).toLocaleDateString('en-IN') : '—'}</td>
        <td>${fmt(c.bookingAmount)}</td>
        <td>${Number(c.commissionRate).toFixed(1)}%</td>
        <td>${fmt(c.commissionAmount)}</td>
        <td style="color:${c.status === 'RELEASED' ? '#16a34a' : '#d97706'}">${c.status}</td>
        <td>${c.releasedAt ? new Date(c.releasedAt).toLocaleDateString('en-IN') : '—'}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .logo { font-size: 22px; font-weight: bold; color: #3b5bdb; }
    .title { font-size: 18px; font-weight: bold; color: #111; }
    .subtitle { color: #666; font-size: 12px; margin-top: 4px; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 20px 0; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-value { font-size: 20px; font-weight: bold; color: #111; }
    .summary-label { font-size: 11px; color: #666; margin-top: 4px; }
    .agent-info { margin-bottom: 24px; }
    .agent-info h2 { font-size: 15px; margin-bottom: 8px; }
    .agent-info p { margin: 2px 0; color: #444; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #3b5bdb; color: #fff; text-align: left; padding: 10px 12px; font-size: 12px; }
    td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Podversal Studio</div>
      <div style="font-size:12px;color:#666;margin-top:4px;">${process.env.ADMIN_EMAIL ?? process.env.SMTP_USER ?? ''}</div>
    </div>
    <div style="text-align:right;">
      <div class="title">Commission Statement</div>
      <div class="subtitle">Generated: ${date}</div>
    </div>
  </div>
  <hr/>

  <div class="agent-info">
    <h2>${agent.user?.name ?? 'Agent'}</h2>
    <p>Agency: ${agent.agencyName ?? '—'}</p>
    <p>Commission Rate: ${agent.commissionRate}%</p>
    ${agent.gstNumber ? `<p>GST: ${agent.gstNumber}</p>` : ''}
    ${agent.user?.email ? `<p>Email: ${agent.user.email}</p>` : ''}
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-value">${fmt(summary.total)}</div>
      <div class="summary-label">Total Earned</div>
    </div>
    <div class="summary-card" style="border-color:#fde68a;">
      <div class="summary-value" style="color:#d97706;">${fmt(summary.pending)}</div>
      <div class="summary-label">Pending Payout</div>
    </div>
    <div class="summary-card" style="border-color:#bbf7d0;">
      <div class="summary-value" style="color:#16a34a;">${fmt(summary.released)}</div>
      <div class="summary-label">Released</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Booking Code</th>
        <th>Service</th>
        <th>Shoot Date</th>
        <th>Booking Amount</th>
        <th>Rate</th>
        <th>Commission</th>
        <th>Status</th>
        <th>Released On</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="8" style="text-align:center;color:#999;">No commissions yet</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    Podversal Studio · This is a computer-generated commission statement · ${date}
  </div>
</body>
</html>`;
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

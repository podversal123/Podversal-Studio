import { Injectable } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      todaysBookings,
      pendingBookings,
      monthlyPayments,
      totalCustomers,
      pendingCommissions,
      recentBookings,
      bookingsByService,
      revenueByMonth,
      topAgentCommissions,
    ] = await Promise.all([
      // Today's bookings
      this.prisma.booking.count({
        where: { shootDate: { gte: today, lt: tomorrow }, status: { notIn: [BookingStatus.CANCELLED] } },
      }),

      // Pending action bookings (REQUEST + QUOTED + APPROVED)
      this.prisma.booking.count({
        where: { status: { in: [BookingStatus.REQUEST, BookingStatus.QUOTED, BookingStatus.APPROVED] } },
      }),

      // This month's revenue (PAID payments)
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),

      // Total active customers
      this.prisma.customer.count(),

      // Pending commissions total
      this.prisma.commission.aggregate({
        where: { status: 'PENDING' },
        _sum: { commissionAmount: true },
      }),

      // Recent 10 bookings
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { service: { select: { name: true, type: true } } },
        where: { status: { notIn: [BookingStatus.CANCELLED] } },
      }),

      // Bookings count per service type
      this.prisma.booking.groupBy({
        by: ['serviceId'],
        _count: { id: true },
        where: { status: { notIn: [BookingStatus.CANCELLED] } },
      }),

      // Revenue for last 6 months
      this.getRevenueByMonth(6),

      // Top 5 agents by total commission earned
      this.prisma.commission.groupBy({
        by:      ['agentId'],
        _sum:    { commissionAmount: true },
        orderBy: { _sum: { commissionAmount: 'desc' } },
        take:    5,
      }),
    ]);

    // Resolve agent names for top agents
    const agentIds = topAgentCommissions.map((c) => c.agentId);
    const agents = await this.prisma.agent.findMany({
      where:  { id: { in: agentIds } },
      select: { id: true, user: { select: { name: true } } },
    });
    const topAgents = topAgentCommissions.map((c) => ({
      agentId:         c.agentId,
      name:            agents.find((a) => a.id === c.agentId)?.user?.name ?? 'Unknown',
      totalCommission: c._sum.commissionAmount ?? 0,
    }));

    // Studio occupancy today (hours booked / 20 operating hours)
    const todayHours = await this.prisma.booking.aggregate({
      where: { shootDate: { gte: today, lt: tomorrow }, status: { notIn: [BookingStatus.CANCELLED] } },
      _sum: { durationHours: true },
    });
    const occupancyRate = Math.min(100, Math.round(((todayHours._sum.durationHours ?? 0) / 20) * 100));

    return {
      todaysBookings,
      pendingBookings,
      monthlyRevenue: monthlyPayments._sum.amount ?? 0,
      totalCustomers,
      pendingCommissions: pendingCommissions._sum.commissionAmount ?? 0,
      occupancyRate,
      recentBookings,
      bookingsByService,
      revenueByMonth,
      topAgents,
    };
  }

  private async getRevenueByMonth(months: number) {
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end   = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const revenue = await this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, paidAt: { gte: start, lt: end } },
        _sum: { amount: true },
      });

      result.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: revenue._sum.amount ?? 0,
      });
    }
    return result;
  }
}

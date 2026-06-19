import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  // Returns all bookings for a date range — used by FullCalendar on frontend
  async getEvents(from: string, to: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        shootDate: {
          gte: new Date(from),
          lte: new Date(to),
        },
        status: {
          notIn: [BookingStatus.CANCELLED],
        },
      },
      include: {
        service: { select: { name: true, type: true } },
        employee: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ shootDate: 'asc' }, { startTime: 'asc' }],
    });

    // Shape data as FullCalendar events
    return bookings.map((b) => ({
      id: b.id,
      title: `${b.service.name} — ${b.customerName}`,
      date: b.shootDate.toISOString().split('T')[0],
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      serviceType: b.service.type,
      employee: b.employee?.user?.name ?? null,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
    }));
  }

  // Returns booked slots for a specific date — used during booking form
  async getBookedSlots(date: string) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const bookings = await this.prisma.booking.findMany({
      where: {
        shootDate: { gte: start, lt: end },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
      select: { startTime: true, endTime: true, status: true },
    });

    return bookings;
  }
}

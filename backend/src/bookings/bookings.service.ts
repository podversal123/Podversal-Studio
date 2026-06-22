import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SendQuoteDto } from './dto/send-quote.dto';
import { AssignEmployeeDto } from './dto/assign-employee.dto';

const slotKey = (date: string, start: string, end: string) =>
  `slot:${date}:${start}-${end}`;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateBookingDto, createdById: string, userRole: Role) {
    this.validateSlot(dto.startTime, dto.endTime);
    await this.checkNoOverlap(dto.shootDate, dto.startTime, dto.endTime);

    const key = slotKey(dto.shootDate, dto.startTime, dto.endTime);
    const locked = await this.redis.lockSlot(key, createdById);
    if (!locked) {
      throw new BadRequestException(
        'This slot is currently being booked by someone else. Please try again in a few minutes.',
      );
    }

    // Auto-price from service rate — no manual quote needed
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException('Service not found');
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const durationHours = (toMin(dto.endTime) - toMin(dto.startTime)) / 60;
    const totalAmount   = Math.round(durationHours * Number(service.pricePerHour));
    const advanceAmount = totalAmount; // full payment upfront

    let customerId: string | undefined;
    if (userRole === Role.CUSTOMER) {
      const customer = await this.prisma.customer.findFirst({ where: { user: { id: createdById } } });
      if (customer) customerId = customer.id;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingCode = `BK-${dateStr}-${suffix}`;

    let booking: any;
    try {
      booking = await this.prisma.booking.create({
        data: {
          ...dto,
          bookingCode,
          shootDate:     new Date(dto.shootDate),
          createdById,
          customerId,
          agentId:       dto.agentId ?? undefined,
          totalAmount,
          advanceAmount,
          discountAmount: 0,
          status:         BookingStatus.APPROVED,
        },
        include: { service: true, createdBy: { select: { id: true, name: true, email: true } } },
      });
    } catch (err) {
      await this.redis.releaseSlot(key);
      throw err;
    }

    this.notifications.sendBookingNotification(booking.id, 'BOOKING_CREATED').catch(() => {});
    return booking;
  }

  findAll(userId: string, userRole: Role, query: { date?: string; status?: BookingStatus }) {
    const where: any = {};

    // Customer: match via Customer profile OR via createdById (if Customer record doesn't exist yet)
    if (userRole === Role.CUSTOMER) {
      where.OR = [{ customer: { userId } }, { createdById: userId }];
    }
    if (userRole === Role.REFERRAL_AGENT) where.agent    = { userId };
    if (userRole === Role.EMPLOYEE)       where.employee = { userId };

    if (query.date) {
      const start = new Date(query.date);
      const end   = new Date(query.date);
      end.setDate(end.getDate() + 1);
      where.shootDate = { gte: start, lt: end };
    }

    if (query.status) where.status = query.status;

    return this.prisma.booking.findMany({
      where,
      include: {
        service:  { select: { name: true, type: true } },
        employee: { select: { user: { select: { name: true } } } },
        agent:    { select: { user: { select: { name: true } } } },
      },
      orderBy: [{ shootDate: 'desc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service:   true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        customer:  { include: { user: { select: { name: true, email: true, phone: true } } } },
        agent:     { include: { user: { select: { name: true, email: true } } } },
        employee:  { include: { user: { select: { name: true, email: true } } } },
        payments:  true,
        invoices:  true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async sendQuote(id: string, dto: SendQuoteDto) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.REQUEST && booking.status !== BookingStatus.CHECKING) {
      throw new BadRequestException('Quote can only be sent for bookings in REQUEST or CHECKING status');
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        totalAmount:    dto.totalAmount,
        advanceAmount:  dto.totalAmount - (dto.discountAmount ?? 0),
        discountAmount: dto.discountAmount ?? 0,
        status:         BookingStatus.QUOTED,
      },
    });
    this.notifications.sendBookingNotification(id, 'QUOTE_SENT').catch(() => {});
    return updated;
  }

  async approve(id: string) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.QUOTED) {
      throw new BadRequestException('Only QUOTED bookings can be approved');
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.APPROVED },
    });
    this.notifications.sendBookingNotification(id, 'BOOKING_APPROVED').catch(() => {});
    return updated;
  }

  async cancel(id: string, userId: string, userRole: Role) {
    const booking = await this.findOne(id);

    if (userRole === Role.CUSTOMER) {
      const isCreator  = booking.createdById === userId;
      const isCustomer = booking.customer?.userId === userId;
      if (!isCreator && !isCustomer) throw new ForbiddenException();
      if (booking.status === BookingStatus.ADVANCE_PAID || booking.status === BookingStatus.IN_PROGRESS) {
        throw new BadRequestException('Cannot cancel a booking after advance payment');
      }
    }

    const key = slotKey(
      booking.shootDate.toISOString().split('T')[0],
      booking.startTime,
      booking.endTime,
    );
    await this.redis.releaseSlot(key);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
    this.notifications.sendBookingNotification(id, 'BOOKING_CANCELLED').catch(() => {});
    return updated;
  }

  async assignEmployee(id: string, dto: AssignEmployeeDto) {
    await this.findOne(id);
    return this.prisma.booking.update({
      where: { id },
      data: { employeeId: dto.employeeId },
    });
  }

  async markInProgress(id: string) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.ADVANCE_PAID) {
      throw new BadRequestException('Booking must have advance paid before starting');
    }
    return this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.IN_PROGRESS } });
  }

  async markCompleted(id: string) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking must be IN_PROGRESS to mark as completed');
    }
    return this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.COMPLETED } });
  }

  async checkAvailability(date: string, startTime: string, endTime: string) {
    const key      = slotKey(date, startTime, endTime);
    const lockedBy = await this.redis.getSlotLock(key);
    const overlap  = await this.hasOverlap(date, startTime, endTime);

    return {
      available:           !lockedBy && !overlap,
      lockedBy:            lockedBy ?? null,
      hasConfirmedBooking: overlap,
    };
  }

  private validateSlot(startTime: string, endTime: string) {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const start = toMin(startTime);
    const end   = toMin(endTime);

    // Valid start times: 06:00, 08:00, ..., 24:00 (midnight) — 2-hour boundaries only
    const VALID_START_MINUTES = [360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440];
    const CLOSE        = 26 * 60; // 2:00 AM next day = 1560 min
    const MIN_DURATION = 2 * 60;  // 2 hours minimum

    if (!VALID_START_MINUTES.includes(start)) {
      throw new BadRequestException(
        'Start time must be on a 2-hour slot: 6 AM, 8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM, 10 PM, or 12 AM (midnight)',
      );
    }
    if (end > CLOSE) {
      throw new BadRequestException('Booking cannot end after 2:00 AM');
    }
    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
    if (end - start < MIN_DURATION) {
      throw new BadRequestException('Minimum booking duration is 2 hours');
    }
    if ((end - start) % MIN_DURATION !== 0) {
      throw new BadRequestException('Booking duration must be in 2-hour increments (2h, 4h, 6h, ...)');
    }
  }

  private async checkNoOverlap(date: string, startTime: string, endTime: string) {
    const overlap = await this.hasOverlap(date, startTime, endTime);
    if (overlap) throw new BadRequestException('This time slot is already booked. Please choose a different time.');
  }

  private async hasOverlap(date: string, startTime: string, endTime: string) {
    const shootDate = new Date(date);
    const nextDay   = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await this.prisma.booking.findFirst({
      where: {
        shootDate: { gte: shootDate, lt: nextDay },
        status:    { notIn: [BookingStatus.CANCELLED, BookingStatus.REQUEST, BookingStatus.CHECKING] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
    return !!existing;
  }
}

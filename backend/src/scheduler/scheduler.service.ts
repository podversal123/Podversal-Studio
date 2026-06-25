import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma:        PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Runs every day at 9:00 AM — sends reminder for bookings shooting tomorrow
  @Cron('0 9 * * *')
  async sendShootReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        shootDate: { gte: start, lte: end },
        status: { in: [BookingStatus.ADVANCE_PAID, BookingStatus.APPROVED] },
      },
      select: { id: true, bookingCode: true },
    });

    this.logger.log(`SHOOT_REMINDER: sending ${bookings.length} reminder(s) for tomorrow`);

    for (const booking of bookings) {
      try {
        await this.notifications.sendBookingNotification(booking.id, 'SHOOT_REMINDER');
      } catch (err) {
        this.logger.error(`Failed to send reminder for booking ${booking.bookingCode}`, err);
      }
    }
  }
}

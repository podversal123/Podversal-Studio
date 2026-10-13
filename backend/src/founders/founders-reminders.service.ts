import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { FounderBookingStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FoundersMailService } from "./founders-mail.service";
import { addDays, istNow, slotInstant } from "./founders.constants";

const HOUR_MS = 60 * 60 * 1000;

// Reminders:
//   • "day"  → the day before the session, from 9:00 AM IST
//   • "hour" → from 2 hours before the session starts
//
// Runs every 15 minutes and is idempotent (reminder*SentAt flags), so if the
// free-tier server was asleep at the exact minute, the next run catches up.
// A reminder is skipped when the booking was only made after its send time
// (the person has just received a confirmation).
@Injectable()
export class FoundersRemindersService {
  private readonly logger = new Logger(FoundersRemindersService.name);
  private running = false;

  constructor(
    private prisma: PrismaService,
    private mail: FoundersMailService,
  ) {}

  @Cron("*/15 * * * *", { timeZone: "Asia/Kolkata" })
  async handleCron() {
    if (this.running) return;
    this.running = true;
    try {
      await this.run();
    } catch (err: any) {
      this.logger.error(`Reminder run failed: ${err?.message ?? err}`);
    } finally {
      this.running = false;
    }
  }

  async run(now: Date = new Date()) {
    const today = istNow(now).date;
    const rows = await this.prisma.founderBooking.findMany({
      where: {
        status: FounderBookingStatus.CONFIRMED,
        shootDate: { in: [today, addDays(today, 1)] },
      },
    });

    let sent = 0;
    for (const b of rows) {
      const start = slotInstant(b.shootDate, b.startTime);
      if (start <= now) continue; // session already started

      // 2-hours-before reminder
      const hourAt = new Date(start.getTime() - 2 * HOUR_MS);
      if (!b.reminderHourSentAt && now >= hourAt && b.createdAt < hourAt) {
        if (await this.deliver(b, "hour")) sent++;
        continue;
      }

      // Day-before reminder (9 AM IST the previous day)
      const dayAt = slotInstant(addDays(b.shootDate, -1), "09:00");
      if (
        !b.reminderDaySentAt &&
        now >= dayAt &&
        now < hourAt &&
        b.createdAt < dayAt
      ) {
        if (await this.deliver(b, "day")) sent++;
      }
    }
    return { checked: rows.length, sent };
  }

  private async deliver(
    b: Awaited<ReturnType<PrismaService["founderBooking"]["findMany"]>>[number],
    kind: "day" | "hour",
  ): Promise<boolean> {
    try {
      await this.mail.sendReminder(b, kind);
      await this.prisma.founderBooking.update({
        where: { id: b.id },
        data:
          kind === "day"
            ? { reminderDaySentAt: new Date() }
            : { reminderHourSentAt: new Date() },
      });
      this.logger.log(`Sent ${kind} reminder for ${b.bookingCode}`);
      return true;
    } catch (err: any) {
      // Flag stays null → the next 15-minute run retries until the session starts.
      this.logger.error(
        `${kind} reminder failed for ${b.bookingCode}: ${err?.message ?? err}`,
      );
      return false;
    }
  }
}

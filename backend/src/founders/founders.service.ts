import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingStatus,
  FounderBooking,
  FounderBookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { FoundersMailService } from "./founders-mail.service";
import { CreateFounderBookingDto } from "./dto/founder.dto";
import {
  BOOKING_WINDOW_DAYS,
  FOUNDER_TEAMS,
  MAX_ACTIVE_PER_CONTACT,
  MIN_NOTICE_MINUTES,
  SLOT_START_HOURS,
  VENUE,
  addDays,
  formatTime12,
  hhmm,
  isValidDateStr,
  istNow,
  memberById,
} from "./founders.constants";

type Interval = { start: string; end: string };

// Paid bookings in these statuses do not hold the studio (mirrors BookingsService.hasOverlap)
const NON_BLOCKING_PAID: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.REQUEST,
  BookingStatus.CHECKING,
];

const NO_LOCK = "no-lock";
const RATE_LIMIT_ATTEMPTS = 20;

@Injectable()
export class FoundersService {
  private readonly logger = new Logger(FoundersService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private mail: FoundersMailService,
  ) {}

  // ── Public: config the landing page needs ─────────────────────────────────
  getConfig() {
    return {
      teams: FOUNDER_TEAMS,
      venue: VENUE,
      windowDays: BOOKING_WINDOW_DAYS,
      slots: SLOT_START_HOURS.map((h) => ({
        start: hhmm(h),
        end: hhmm(h + 1),
        label: `${formatTime12(hhmm(h))} – ${formatTime12(hhmm(h + 1))}`,
      })),
    };
  }

  // ── Availability ──────────────────────────────────────────────────────────

  /** Everything that already occupies the studio between two IST dates (inclusive). */
  private async takenByDate(
    from: string,
    to: string,
  ): Promise<Map<string, Interval[]>> {
    const [founder, paid] = await Promise.all([
      this.prisma.founderBooking.findMany({
        where: {
          shootDate: { gte: from, lte: to },
          status: { not: FounderBookingStatus.CANCELLED },
        },
        select: { shootDate: true, startTime: true, endTime: true },
      }),
      this.prisma.booking.findMany({
        where: {
          shootDate: {
            gte: new Date(`${from}T00:00:00Z`),
            lt: new Date(`${addDays(to, 1)}T00:00:00Z`),
          },
          status: { notIn: NON_BLOCKING_PAID },
        },
        select: { shootDate: true, startTime: true, endTime: true },
      }),
    ]);

    const map = new Map<string, Interval[]>();
    const push = (date: string, start: string, end: string) => {
      const list = map.get(date) ?? [];
      list.push({ start, end });
      map.set(date, list);
    };
    founder.forEach((b) => push(b.shootDate, b.startTime, b.endTime));
    paid.forEach((b) =>
      push(b.shootDate.toISOString().slice(0, 10), b.startTime, b.endTime),
    );
    return map;
  }

  private slotsFor(date: string, taken: Interval[]) {
    const now = istNow();
    return SLOT_START_HOURS.map((h) => {
      const start = hhmm(h);
      const end = hhmm(h + 1);
      const blocked = taken.some((t) => t.start < end && t.end > start);
      const tooSoon =
        date < now.date ||
        (date === now.date && h * 60 - now.minutes < MIN_NOTICE_MINUTES);
      return {
        start,
        end,
        label: `${formatTime12(start)} – ${formatTime12(end)}`,
        available: !blocked && !tooSoon,
      };
    });
  }

  private assertDateInWindow(date: string) {
    if (!isValidDateStr(date)) throw new BadRequestException("Invalid date");
    const today = istNow().date;
    const last = addDays(today, BOOKING_WINDOW_DAYS - 1);
    if (date < today || date > last) {
      throw new BadRequestException(
        "Please choose a date within the next " +
          BOOKING_WINDOW_DAYS +
          " days.",
      );
    }
  }

  async getSlots(date: string) {
    this.assertDateInWindow(date);
    const taken = await this.takenByDate(date, date);
    return { date, slots: this.slotsFor(date, taken.get(date) ?? []) };
  }

  /** Per-day free-slot counts for the calendar grid. */
  async getDays() {
    const today = istNow().date;
    const last = addDays(today, BOOKING_WINDOW_DAYS - 1);
    const taken = await this.takenByDate(today, last);
    const days = [];
    for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
      const date = addDays(today, i);
      const available = this.slotsFor(date, taken.get(date) ?? []).filter(
        (s) => s.available,
      ).length;
      days.push({ date, available, total: SLOT_START_HOURS.length });
    }
    return { days };
  }

  // ── Booking ───────────────────────────────────────────────────────────────

  // Soft per-IP limit (RATE_LIMIT_ATTEMPTS per 10 min). Deliberately generous:
  // many people share one IP (office wifi, mobile-carrier NAT, our own team
  // demoing at a client site). Fails open if Redis is unavailable.
  private async rateLimited(ip: string): Promise<boolean> {
    if (!ip) return false;
    const key = `founders:rl:${ip}`;
    try {
      const current = Number((await this.redis.get(key)) ?? 0);
      if (current >= RATE_LIMIT_ATTEMPTS) return true;
      await this.redis.set(key, String(current + 1), 600);
    } catch {
      /* ignore */
    }
    return false;
  }

  private async acquireLock(date: string): Promise<string | null> {
    try {
      for (let i = 0; i < 5; i++) {
        const token = await this.redis.acquireDateLock(date);
        if (token) return token;
        await new Promise((r) => setTimeout(r, 200));
      }
      return null;
    } catch (err: any) {
      // Redis down: carry on — the partial unique index still prevents
      // founder-vs-founder double booking at the database level.
      this.logger.warn(`Redis lock unavailable: ${err?.message ?? err}`);
      return NO_LOCK;
    }
  }

  private async releaseLock(date: string, token: string) {
    if (token === NO_LOCK) return;
    try {
      await this.redis.releaseDateLock(date, token);
    } catch {
      /* lock auto-expires in 10s */
    }
  }

  private newCode(date: string) {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `FP-${date.replace(/-/g, "")}-${rand}`;
  }

  async book(dto: CreateFounderBookingDto, ip: string) {
    // Honeypot filled → pretend success, store nothing.
    if (dto.website && dto.website.trim() !== "") {
      return { success: true, bookingCode: "FP-OK", ignored: true };
    }

    if (await this.rateLimited(ip)) {
      throw new BadRequestException(
        "Too many attempts. Please wait a few minutes and try again.",
      );
    }

    this.assertDateInWindow(dto.shootDate);
    const hour = Number(dto.startTime.slice(0, 2));
    if (!SLOT_START_HOURS.includes(hour)) {
      throw new BadRequestException(
        "That time is outside our founder session hours (10 AM – 6 PM).",
      );
    }
    const startTime = hhmm(hour);
    const endTime = hhmm(hour + 1);

    // Limit repeat bookings per person (typo-proofing + abuse protection)
    const today = istNow().date;
    const active = await this.prisma.founderBooking.count({
      where: {
        status: FounderBookingStatus.CONFIRMED,
        shootDate: { gte: today },
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });
    if (active >= MAX_ACTIVE_PER_CONTACT) {
      throw new ConflictException(
        "You already have upcoming bookings with us. Please contact the team to change them.",
      );
    }

    const token = await this.acquireLock(dto.shootDate);
    if (!token) {
      throw new ConflictException(
        "This date is being booked by someone else right now. Please try again in a few seconds.",
      );
    }

    let booking: FounderBooking;
    try {
      // Re-check under the lock (includes paid studio bookings + minimum notice)
      const taken = await this.takenByDate(dto.shootDate, dto.shootDate);
      const slot = this.slotsFor(dto.shootDate, taken.get(dto.shootDate) ?? [])
        .find((s) => s.start === startTime);
      if (!slot?.available) {
        throw new ConflictException(
          "Sorry, that slot was just taken. Please pick another time.",
        );
      }

      for (let attempt = 0; ; attempt++) {
        try {
          booking = await this.prisma.founderBooking.create({
            data: {
              bookingCode: this.newCode(dto.shootDate),
              companyName: dto.companyName,
              name: dto.name,
              email: dto.email,
              phone: dto.phone,
              referredBy: dto.referredBy,
              shootDate: dto.shootDate,
              startTime,
              endTime,
            },
          });
          break;
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          ) {
            // Slot index → someone beat us. Code collision → retry with a new code.
            const fresh = await this.takenByDate(dto.shootDate, dto.shootDate);
            const stillFree = this.slotsFor(
              dto.shootDate,
              fresh.get(dto.shootDate) ?? [],
            ).find((s) => s.start === startTime)?.available;
            if (!stillFree || attempt >= 3) {
              throw new ConflictException(
                "Sorry, that slot was just taken. Please pick another time.",
              );
            }
            continue;
          }
          throw err;
        }
      }
    } finally {
      await this.releaseLock(dto.shootDate, token);
    }

    void this.afterCreate(booking);

    return {
      success: true,
      id: booking.id,
      bookingCode: booking.bookingCode,
      companyName: booking.companyName,
      name: booking.name,
      email: booking.email,
      shootDate: booking.shootDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      venue: VENUE,
    };
  }

  // Emails never block or fail the booking itself; failures are recorded + alerted.
  private async afterCreate(b: FounderBooking) {
    try {
      await this.mail.sendConfirmation(b);
      await this.prisma.founderBooking.update({
        where: { id: b.id },
        data: { confirmationSentAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(
        `Confirmation email failed for ${b.bookingCode}: ${err?.message ?? err}`,
      );
      await this.mail
        .sendAdminAlert(
          `Confirmation email failed (${b.bookingCode})`,
          `The confirmation email to ${b.name} <${b.email}> (${b.phone}) for ${b.shootDate} ${b.startTime} could not be sent. Please contact them directly. Error: ${err?.message ?? err}`,
        )
        .catch(() => undefined);
    }
    await this.mail.sendAdminNewBooking(b).catch((err) =>
      this.logger.error(`Admin notification failed: ${err?.message ?? err}`),
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async list(filters: {
    status?: string;
    referredBy?: string;
    date?: string;
  }) {
    const where: Prisma.FounderBookingWhereInput = {};
    if (
      filters.status &&
      Object.values(FounderBookingStatus).includes(
        filters.status as FounderBookingStatus,
      )
    ) {
      where.status = filters.status as FounderBookingStatus;
    }
    if (filters.referredBy) where.referredBy = filters.referredBy;
    if (filters.date && isValidDateStr(filters.date)) {
      where.shootDate = filters.date;
    }
    const rows = await this.prisma.founderBooking.findMany({
      where,
      orderBy: [{ shootDate: "asc" }, { startTime: "asc" }],
    });
    return rows.map((b) => {
      const ref = memberById(b.referredBy);
      return {
        ...b,
        referrerName: ref?.member.name ?? b.referredBy,
        teamName: ref?.team.name ?? "—",
      };
    });
  }

  async leaderboard() {
    const grouped = await this.prisma.founderBooking.groupBy({
      by: ["referredBy", "status"],
      _count: { _all: true },
    });
    const count = (id: string, status: FounderBookingStatus) =>
      grouped.find((g) => g.referredBy === id && g.status === status)?._count
        ._all ?? 0;

    const teams = FOUNDER_TEAMS.map((team) => {
      const members = team.members.map((m) => {
        const confirmed = count(m.id, FounderBookingStatus.CONFIRMED);
        const completed = count(m.id, FounderBookingStatus.COMPLETED);
        const cancelled = count(m.id, FounderBookingStatus.CANCELLED);
        return {
          id: m.id,
          name: m.name,
          confirmed,
          completed,
          cancelled,
          total: confirmed + completed, // cancelled bookings never count
        };
      });
      const sum = (k: "confirmed" | "completed" | "cancelled" | "total") =>
        members.reduce((s, m) => s + m[k], 0);
      return {
        id: team.id,
        name: team.name,
        confirmed: sum("confirmed"),
        completed: sum("completed"),
        cancelled: sum("cancelled"),
        total: sum("total"),
        members: members.sort((a, b) => b.total - a.total),
      };
    }).sort((a, b) => b.total - a.total);

    return {
      teams,
      totals: {
        total: teams.reduce((s, t) => s + t.total, 0),
        confirmed: teams.reduce((s, t) => s + t.confirmed, 0),
        completed: teams.reduce((s, t) => s + t.completed, 0),
        cancelled: teams.reduce((s, t) => s + t.cancelled, 0),
      },
    };
  }

  private async findOrThrow(id: string) {
    const b = await this.prisma.founderBooking.findUnique({ where: { id } });
    if (!b) throw new NotFoundException("Booking not found");
    return b;
  }

  async updateStatus(id: string, status: "COMPLETED" | "CANCELLED") {
    const b = await this.findOrThrow(id);
    if (b.status !== FounderBookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed bookings can be changed (this one is ${b.status}).`,
      );
    }
    const updated = await this.prisma.founderBooking.update({
      where: { id },
      data: { status },
    });
    if (status === "CANCELLED") {
      this.mail
        .sendCancellation(updated)
        .catch((err) =>
          this.logger.error(`Cancellation email failed: ${err?.message ?? err}`),
        );
    }
    return updated;
  }

  async resendConfirmation(id: string) {
    const b = await this.findOrThrow(id);
    if (b.status === FounderBookingStatus.CANCELLED) {
      throw new BadRequestException("This booking is cancelled.");
    }
    await this.mail.sendConfirmation(b);
    return this.prisma.founderBooking.update({
      where: { id },
      data: { confirmationSentAt: new Date() },
    });
  }
}

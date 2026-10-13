// Public (no-login) API client for the founders landing page.
// Plain fetch on purpose: the shared axios instance adds auth headers and
// redirects to /login on 401, neither of which applies to visitors.

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface FounderMember {
  id: string;
  name: string;
}
export interface FounderTeam {
  id: string;
  name: string;
  members: FounderMember[];
}
export interface FounderSlotDef {
  start: string;
  end: string;
  label: string;
}
export interface FounderConfig {
  teams: FounderTeam[];
  venue: string;
  windowDays: number;
  slots: FounderSlotDef[];
}
export interface FounderDay {
  date: string; // YYYY-MM-DD (IST)
  available: number;
  total: number;
}
export interface FounderSlot extends FounderSlotDef {
  available: boolean;
}
export interface FounderBookingResult {
  success: boolean;
  bookingCode: string;
  companyName: string;
  name: string;
  email: string;
  shootDate: string;
  startTime: string;
  endTime: string;
  venue: string;
}
export interface FounderBookingInput {
  companyName: string;
  name: string;
  email: string;
  phone: string;
  referredBy: string;
  shootDate: string;
  startTime: string;
  website?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The API runs on a free tier that sleeps when idle: the first request after a
// quiet spell can be slow or return a transient 502/503. Reads therefore get a
// timeout plus automatic retries; the booking POST is never retried (a retry
// after a timeout could create a second booking).
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isRead = !init?.method || init.method === "GET";
  const attempts = isRead ? 3 : 1;
  const timeoutMs = isRead ? 20000 : 45000;
  let lastError = new ApiError("Something went wrong. Please try again.", 0);

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(900 * attempt);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        ...init,
        signal: controller.signal,
        // No Content-Type on reads: it would turn every GET into a "non-simple"
        // request and make the browser send an extra preflight round trip first.
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });
    } catch {
      lastError = new ApiError(
        isRead
          ? "We couldn't reach the booking system. Check your internet connection and try again."
          : "We couldn't confirm whether your booking went through. Please check your email for a confirmation before trying again.",
        0,
      );
      continue;
    } finally {
      clearTimeout(timer);
    }

    // Transient server-side failure (e.g. the server is waking up): try again
    if (isRead && res.status >= 502 && res.status <= 504 && attempt < attempts - 1) {
      lastError = new ApiError("The booking system is starting up. Please try again.", res.status);
      continue;
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const raw = body?.message;
      const message = Array.isArray(raw)
        ? raw[0]
        : typeof raw === "string"
          ? raw
          : "Something went wrong. Please try again.";
      throw new ApiError(message, res.status);
    }
    return body as T;
  }
  throw lastError;
}

export const foundersApi = {
  config: () => request<FounderConfig>("/founders/config"),
  days: () => request<{ days: FounderDay[] }>("/founders/days"),
  slots: (date: string) =>
    request<{ date: string; slots: FounderSlot[] }>(
      `/founders/slots?date=${encodeURIComponent(date)}`,
    ),
  book: (input: FounderBookingInput) =>
    request<FounderBookingResult>("/founders/book", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

// ── Small formatting helpers shared by the page ─────────────────────────────

export const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const formatDateLong = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const formatDateShort = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/** .ics file for "Add to calendar" (times converted from IST to UTC). */
export function buildIcs(b: FounderBookingResult): string {
  const toUtc = (date: string, time: string) =>
    new Date(`${date}T${time}:00+05:30`)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Podversal Studio//Founders Podcast//EN",
    "BEGIN:VEVENT",
    `UID:${b.bookingCode}@podversal.com`,
    `DTSTAMP:${toUtc(b.shootDate, b.startTime)}`,
    `DTSTART:${toUtc(b.shootDate, b.startTime)}`,
    `DTEND:${toUtc(b.shootDate, b.endTime)}`,
    "SUMMARY:Inside the Founder's Mind - Podcast at Podversal Studio",
    `LOCATION:${b.venue.replace(/,/g, "\\,")}`,
    `DESCRIPTION:Booking ID ${b.bookingCode}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Podcast shoot in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

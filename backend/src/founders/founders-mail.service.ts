import { Injectable, Logger } from "@nestjs/common";
import {
  FounderBooking,
} from "@prisma/client";
import {
  VENUE,
  formatDateLong,
  formatTime12,
  memberById,
  slotInstant,
} from "./founders.constants";

const MAROON = "#8A1519";
const CREAM = "#FBF3DC";

const esc = (s: string) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

type Attachment = { content: string; name: string };

@Injectable()
export class FoundersMailService {
  private readonly logger = new Logger(FoundersMailService.name);

  // ── Low-level send via Brevo HTTP API (same provider the rest of the app uses)
  private async send(
    to: string,
    subject: string,
    html: string,
    attachment?: Attachment[],
  ): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      this.logger.warn(`[Email DEV - no BREVO_API_KEY] To: ${to} | ${subject}`);
      return;
    }
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ?? "podversalstudio@gmail.com";

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Podversal Studio", email: senderEmail },
        to: [{ email: to }],
        replyTo: { email: process.env.ADMIN_EMAIL ?? senderEmail },
        subject,
        htmlContent: html,
        ...(attachment?.length ? { attachment } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    }
    this.logger.log(`Email sent to ${to} | ${subject}`);
  }

  // ── Shared themed layout (table-based, inline styles for email clients) ────
  private layout(heading: string, bodyHtml: string): string {
    // The brand logo is dark artwork made for light backgrounds, so it sits on
    // its own cream strip above the maroon title block.
    const logoRow = process.env.EMAIL_LOGO_URL
      ? `<tr><td style="background:${CREAM};padding:18px 24px 14px;text-align:center;"><img src="${esc(process.env.EMAIL_LOGO_URL)}" alt="Podversal Studio" height="72" style="display:block;margin:0 auto;border:0;height:72px;width:auto;" /></td></tr>`
      : "";
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#f1e6cf;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1e6cf;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CREAM};border:1px solid #e3d3ad;">
    ${logoRow}
    <tr><td style="background:${MAROON};padding:28px 24px;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f3d9a8;">Inside the Founder's Mind</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${CREAM};margin-top:8px;">${heading}</div>
    </td></tr>
    <tr><td style="padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#2b1a1a;">
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #e3d3ad;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a7a6a;text-align:center;">
      ${esc(VENUE)}<br>Just reply to this email if you need any help.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
  }

  private detailsTable(b: FounderBooking): string {
    const row = (k: string, v: string) =>
      `<tr><td style="padding:8px 0;color:#8a7a6a;width:110px;vertical-align:top;">${k}</td><td style="padding:8px 0;font-weight:700;color:#2b1a1a;">${v}</td></tr>`;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3d3ad;border-bottom:1px solid #e3d3ad;margin:18px 0;">
      ${row("Date", esc(formatDateLong(b.shootDate)))}
      ${row("Time", `${formatTime12(b.startTime)} – ${formatTime12(b.endTime)} (IST)`)}
      ${row("Where", esc(VENUE))}
      ${row("Booking ID", esc(b.bookingCode))}
    </table>`;
  }

  // ── Calendar invite (.ics, times in UTC so every client shows IST correctly)
  buildIcs(b: FounderBooking): string {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const start = slotInstant(b.shootDate, b.startTime);
    const end = slotInstant(b.shootDate, b.endTime);
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Podversal Studio//Founders Podcast//EN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${b.bookingCode}@podversal.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      "SUMMARY:Inside the Founder's Mind - Podcast at Podversal Studio",
      `LOCATION:${VENUE.replace(/,/g, "\\,")}`,
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

  // ── Emails ─────────────────────────────────────────────────────────────────

  async sendConfirmation(b: FounderBooking): Promise<void> {
    const html = this.layout(
      "Your slot is confirmed",
      `<p>Hi ${esc(b.name)},</p>
       <p>Thank you for accepting our invitation. Your complimentary founder podcast session at Podversal Studio is booked.</p>
       ${this.detailsTable(b)}
       <p>A calendar invite is attached. We will send you a reminder the day before and again 2 hours before your session.</p>
       <p>Need to change the time? Just reply to this email.</p>`,
    );
    await this.send(
      b.email,
      `Confirmed: your podcast slot on ${formatDateLong(b.shootDate)}, ${formatTime12(b.startTime)}`,
      html,
      [
        {
          content: Buffer.from(this.buildIcs(b)).toString("base64"),
          name: "podversal-podcast.ics",
        },
      ],
    );
  }

  async sendReminder(b: FounderBooking, kind: "day" | "hour"): Promise<void> {
    const intro =
      kind === "day"
        ? "This is a friendly reminder that your podcast session is <strong>tomorrow</strong>."
        : "Your podcast session starts in about <strong>2 hours</strong>.";
    const html = this.layout(
      kind === "day" ? "See you tomorrow" : "Starting soon",
      `<p>Hi ${esc(b.name)},</p>
       <p>${intro}</p>
       ${this.detailsTable(b)}
       <p>Please arrive a few minutes early. If something has come up, reply to this email and we will help.</p>`,
    );
    await this.send(
      b.email,
      kind === "day"
        ? `Reminder: your podcast is tomorrow at ${formatTime12(b.startTime)}`
        : `Starting soon: your podcast at ${formatTime12(b.startTime)} today`,
      html,
    );
  }

  async sendCancellation(b: FounderBooking): Promise<void> {
    const html = this.layout(
      "Your booking was cancelled",
      `<p>Hi ${esc(b.name)},</p>
       <p>Your founder podcast booking below has been cancelled.</p>
       ${this.detailsTable(b)}
       <p>If this is unexpected or you would like a new slot, just reply to this email.</p>`,
    );
    await this.send(b.email, `Cancelled: booking ${b.bookingCode}`, html);
  }

  async sendAdminNewBooking(b: FounderBooking): Promise<void> {
    const admin = process.env.ADMIN_EMAIL;
    if (!admin) return;
    const ref = memberById(b.referredBy);
    const html = this.layout(
      "New founder booking",
      `${this.detailsTable(b)}
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
         <tr><td style="padding:4px 0;color:#8a7a6a;width:110px;">Company</td><td style="padding:4px 0;font-weight:700;">${esc(b.companyName)}</td></tr>
         <tr><td style="padding:4px 0;color:#8a7a6a;">Name</td><td style="padding:4px 0;">${esc(b.name)}</td></tr>
         <tr><td style="padding:4px 0;color:#8a7a6a;">Phone</td><td style="padding:4px 0;">${esc(b.phone)}</td></tr>
         <tr><td style="padding:4px 0;color:#8a7a6a;">Email</td><td style="padding:4px 0;">${esc(b.email)}</td></tr>
         <tr><td style="padding:4px 0;color:#8a7a6a;">Referred by</td><td style="padding:4px 0;font-weight:700;">${esc(ref?.member.name ?? b.referredBy)}${ref ? ` (${esc(ref.team.name)})` : ""}</td></tr>
       </table>`,
    );
    await this.send(
      admin,
      `[Founders] ${b.companyName} — ${formatDateLong(b.shootDate)} ${formatTime12(b.startTime)}`,
      html,
    );
  }

  async sendAdminAlert(subject: string, message: string): Promise<void> {
    const admin = process.env.ADMIN_EMAIL;
    if (!admin) return;
    await this.send(
      admin,
      `[ALERT] ${subject}`,
      this.layout("Needs your attention", `<p>${esc(message)}</p>`),
    );
  }
}

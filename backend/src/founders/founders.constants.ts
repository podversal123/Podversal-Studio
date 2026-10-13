// Single source of truth for the "Inside the Founder's Mind" campaign.
// The frontend reads teams/slots from GET /founders/config, so edit them here only.

export interface FounderMember {
  id: string; // stored in founder_bookings.referredBy and used in ?ref=<id> links
  name: string;
}

export interface FounderTeam {
  id: string;
  name: string;
  members: FounderMember[];
}

export const FOUNDER_TEAMS: FounderTeam[] = [
  {
    id: "team-1",
    name: "Mac and Kash",
    members: [
      { id: "rohan", name: "Rohan" },
      { id: "kanishka", name: "Kanishka" },
    ],
  },
  {
    id: "team-2",
    name: "Rise & Shine",
    members: [
      { id: "ritu", name: "Ritu" },
      { id: "suraj", name: "Suraj" },
    ],
  },
  {
    id: "team-3",
    name: "The Booking Bandits",
    members: [
      { id: "deepanshi", name: "Deepanshi" },
      { id: "abhishek", name: "Abhishek" },
    ],
  },
  {
    id: "team-4",
    name: "Hashtaggers",
    members: [
      { id: "hanshika", name: "Hanshika" },
      { id: "shivam", name: "Shivam" },
    ],
  },
];

export const FOUNDER_MEMBER_IDS = FOUNDER_TEAMS.flatMap((t) =>
  t.members.map((m) => m.id),
);
export const FOUNDER_TEAM_IDS = FOUNDER_TEAMS.map((t) => t.id);

// `referredBy` holds ONE of two things:
//   • a team id ("team-2")  – the visitor picked the team on the form; both
//                             members count together (the team is the unit)
//   • a member id ("ritu")  – the visitor arrived through that member's personal
//                             link, so we also know exactly who it was
// Either way the booking counts for the member's team.
export const FOUNDER_REFERRER_IDS = [...FOUNDER_TEAM_IDS, ...FOUNDER_MEMBER_IDS];

export interface ReferrerInfo {
  team: FounderTeam;
  member: FounderMember | null; // null = chosen at team level
  label: string; // "Ritu" or "Ritu / Suraj"
}

export const referrerInfo = (id: string): ReferrerInfo | null => {
  for (const team of FOUNDER_TEAMS) {
    if (team.id === id) {
      return { team, member: null, label: team.members.map((m) => m.name).join(" / ") };
    }
    const member = team.members.find((m) => m.id === id);
    if (member) return { team, member, label: member.name };
  }
  return null;
};

/** Every referredBy value that counts for this team (its id + its members' ids). */
export const idsForTeam = (teamId: string): string[] => {
  const team = FOUNDER_TEAMS.find((t) => t.id === teamId);
  return team ? [team.id, ...team.members.map((m) => m.id)] : [];
};

// 1-hour slots, 10 AM – 6 PM (last slot 5–6 PM), every day.
export const SLOT_START_HOURS = [10, 11, 12, 13, 14, 15, 16, 17];
export const BOOKING_WINDOW_DAYS = 60; // rolling window, no fixed end date
export const MIN_NOTICE_MINUTES = 60; // same-day slots need this much notice
export const MAX_ACTIVE_PER_CONTACT = 2; // upcoming confirmed bookings per email/phone

export const VENUE =
  "Podversal Studio, B 812, 814, Tower 4, NX One, Greater Noida West, UP";

// ── Time helpers (IST is a fixed UTC+05:30, no DST) ─────────────────────────

export const hhmm = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const istParts = (d: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

/** Current IST calendar date ("YYYY-MM-DD") and minutes since IST midnight. */
export const istNow = (now: Date = new Date()) => istParts(now);

export const isValidDateStr = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

export const addDays = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** The exact instant a slot starts (date + "HH:mm" in IST). */
export const slotInstant = (dateStr: string, time: string) =>
  new Date(`${dateStr}T${time}:00+05:30`);

export const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const formatDateLong = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

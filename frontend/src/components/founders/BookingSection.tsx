"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus, Check, Loader2 } from "lucide-react";
import MonthCalendar from "./MonthCalendar";
import {
  ApiError,
  FounderBookingResult,
  FounderConfig,
  FounderDay,
  FounderSlot,
  buildIcs,
  formatDateLong,
  formatDateShort,
  formatTime12,
  foundersApi,
} from "./founders-api";

// Everything in this section is set in the same serif as the printed invitation.
const SERIF = {
  fontFamily: "var(--font-newsreader), Georgia, serif",
  fontVariantNumeric: "lining-nums",
} as const;
const GRAIN = { backgroundImage: "url(/founders/grain.png)" } as const;
const REF_KEY = "pv_founders_ref";

const schema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name"),
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  referredBy: z.string().min(1, "Choose the team that invited you"),
  website: z.string().optional(), // honeypot
});
type FormValues = z.infer<typeof schema>;

const inputCls =
  "w-full border-0 border-b border-[#89171a]/35 bg-transparent px-0 pb-2 pt-1 text-[21px] leading-snug text-[#2e0a0c] placeholder:italic placeholder:text-[#89171a]/35 transition-[border-color,box-shadow] focus:border-[#89171a] focus:shadow-[0_1px_0_0_#89171a] focus:outline-none";

// Square-cornered, with a fine inner rule like a stationery frame.
// (Full class names on purpose: Tailwind can't see classes built at runtime.)
const primaryBtn =
  "inline-flex min-h-[58px] items-center justify-center gap-2 bg-[#89171a] px-10 text-[20px] font-semibold text-[#faf5dc] shadow-[inset_0_0_0_4px_#89171a,inset_0_0_0_5px_rgba(250,245,220,.5)] transition-colors hover:bg-[#6f1215] hover:shadow-[inset_0_0_0_4px_#6f1215,inset_0_0_0_5px_rgba(250,245,220,.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a] disabled:cursor-not-allowed disabled:opacity-60";
const ghostBtn =
  "inline-flex min-h-[58px] items-center justify-center border border-[#89171a]/50 px-10 text-[20px] text-[#89171a] transition-colors hover:bg-[#89171a]/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a]";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[16px] italic text-[#89171a]/90">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[15px] text-[#b3201f]">
          {error}
        </p>
      )}
    </div>
  );
}

// An invitation-style divider: a rule, the title, a rule
function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span aria-hidden className="h-px flex-1 bg-[#89171a]/25" />
      <h3 className="text-[1.5rem] italic leading-none text-[#89171a]">{children}</h3>
      <span aria-hidden className="h-px flex-1 bg-[#89171a]/25" />
    </div>
  );
}

// A wax-seal style stamp for the confirmation
function Seal() {
  return (
    <div
      aria-hidden
      className="relative mx-auto mb-7 flex h-[84px] w-[84px] -rotate-[8deg] items-center justify-center rounded-full bg-[#89171a] text-[#faf5dc] shadow-[0_10px_24px_-8px_rgba(80,10,12,.55)]"
    >
      <span className="absolute inset-[6px] rounded-full border border-dashed border-[#faf5dc]/55" />
      <Check size={34} strokeWidth={2.4} />
    </div>
  );
}

export default function BookingSection() {
  const [config, setConfig] = useState<FounderConfig | null>(null);
  const [days, setDays] = useState<FounderDay[]>([]);
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [slow, setSlow] = useState(false);

  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<FounderSlot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slotsSlow, setSlotsSlow] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [pickError, setPickError] = useState<{ date?: string; time?: string }>({});

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<FounderBookingResult | null>(null);
  const [refFromLink, setRefFromLink] = useState<string | null>(null);
  // When the visitor came through a member's personal link we remember exactly whose it was
  const [linkMember, setLinkMember] = useState<{ id: string; teamId: string } | null>(null);

  const sectionRef = useRef<HTMLElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { referredBy: "", website: "" },
  });
  const referredBy = watch("referredBy");

  // ── Initial data (also wakes the free-tier server before the user needs it)
  const loadInitial = useCallback(async () => {
    setLoad("loading");
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      const [cfg, d] = await Promise.all([foundersApi.config(), foundersApi.days()]);
      setConfig(cfg);
      setDays(d.days);
      setLoad("ready");

      // Pre-select the inviter from ?ref=ritu (or an earlier visit this session)
      const params = new URLSearchParams(window.location.search);
      let ref = params.get("ref")?.toLowerCase() ?? "";
      try {
        if (ref) sessionStorage.setItem(REF_KEY, ref);
        else ref = sessionStorage.getItem(REF_KEY) ?? "";
      } catch {
        /* ignore */
      }
      const team = cfg.teams.find((t) => t.members.some((m) => m.id === ref));
      const known = team?.members.find((m) => m.id === ref);
      if (team && known) {
        setValue("referredBy", team.id); // the visitor picks a team...
        setLinkMember({ id: known.id, teamId: team.id }); // ...we keep whose link it was
        setRefFromLink(team.name);
      }
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "We couldn't load available times. Please try again.",
      );
      setLoad("error");
    } finally {
      clearTimeout(slowTimer);
    }
  }, [setValue]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ── Slots for the chosen date (kept fresh while the tab is open)
  // Every call gets a ticket number; only the newest ticket may update the
  // screen, so a slow answer for an old date can never overwrite a newer one.
  const slotsTicket = useRef(0);

  const fetchSlots = useCallback(async (d: string, quiet = false) => {
    const ticket = ++slotsTicket.current;
    if (!quiet) {
      setSlotsLoading(true);
      setSlotsError("");
      setSlotsSlow(false);
    }
    const slowTimer = quiet
      ? null
      : setTimeout(() => {
          if (ticket === slotsTicket.current) setSlotsSlow(true);
        }, 3500);
    try {
      const res = await foundersApi.slots(d);
      if (ticket !== slotsTicket.current) return;
      setSlots(res.slots);
      setSlotsError("");
      // Someone may have just taken the slot this visitor selected
      setTime((t) => (t && !res.slots.find((s) => s.start === t)?.available ? null : t));
    } catch (err) {
      if (ticket !== slotsTicket.current) return;
      // A failed refresh in the background keeps what is on screen; a failed
      // first load must say so instead of pretending there are no times.
      if (!quiet) {
        setSlots(null);
        setSlotsError(
          err instanceof ApiError ? err.message : "We couldn't load the times. Please try again.",
        );
      }
    } finally {
      if (slowTimer) clearTimeout(slowTimer);
      if (!quiet && ticket === slotsTicket.current) {
        setSlotsLoading(false);
        setSlotsSlow(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    fetchSlots(date);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchSlots(date, true);
    }, 30000);
    return () => {
      clearInterval(id);
      slotsTicket.current++; // drop any answer still on its way for this date
    };
  }, [date, fetchSlots]);

  const pickDate = (d: string) => {
    setDate(d);
    setTime(null);
    setSlots(null);
    setSlotsError("");
    setPickError({});
    setServerError("");
  };

  const onSubmit = async (v: FormValues) => {
    const next: { date?: string; time?: string } = {};
    if (!date) next.date = "Choose a date";
    else if (!time) next.time = "Choose a time";
    setPickError(next);
    if (!date || !time) {
      document
        .getElementById(!date ? "pick-date" : "pick-time")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setServerError("");
    try {
      const res = await foundersApi.book({
        companyName: v.companyName.trim(),
        name: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        // Same team as the link they arrived on -> record the exact member; otherwise the team
        referredBy:
          linkMember && v.referredBy === linkMember.teamId ? linkMember.id : v.referredBy,
        shootDate: date,
        startTime: time,
        website: v.website ?? "",
      });
      setResult(res);
      requestAnimationFrame(() =>
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (err) {
      const e = err as ApiError;
      setServerError(e.message);
      if (e.status === 409 || e.status === 400) {
        // Refresh what's free so the visitor can pick again straight away
        foundersApi.days().then((d) => setDays(d.days)).catch(() => undefined);
        if (date) fetchSlots(date, true);
        if (e.status === 409) {
          setTime(null);
          // Take them straight back to the times so they can pick another
          setTimeout(
            () =>
              document
                .getElementById("pick-time")
                ?.scrollIntoView({ behavior: "smooth", block: "center" }),
            250,
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const downloadIcs = () => {
    if (!result) return;
    const blob = new Blob([buildIcs(result)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "podversal-podcast.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionCls =
    "relative z-10 -mt-10 rounded-t-[2.5rem] bg-[#faf5dc] px-5 sm:rounded-t-[50%_6rem] sm:px-8 lg:px-12";

  // ── Success
  if (result) {
    return (
      <section
        id="book"
        ref={sectionRef}
        style={{ ...SERIF, ...GRAIN }}
        className={`${sectionCls} pb-24 pt-16 sm:pt-24`}
      >
        <div className="mx-auto max-w-xl text-center">
          <Seal />
          <h2 className="text-[clamp(2.8rem,9vw,4.4rem)] font-bold leading-[0.95] tracking-[-0.02em] text-[#89171a]">
            You’re booked.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[20px] leading-[1.6] text-[#2e0a0c]">
            Thank you, {result.name.split(" ")[0]}. We’ve emailed the details to{" "}
            <strong className="break-all font-semibold">{result.email}</strong>. If it doesn’t
            show up in a few minutes, look in your spam folder.
          </p>

          <dl className="mt-10 divide-y divide-[#89171a]/20 border-y border-[#89171a]/20 text-left">
            {[
              ["Date", formatDateLong(result.shootDate)],
              ["Time", `${formatTime12(result.startTime)} – ${formatTime12(result.endTime)}`],
              ["Where", result.venue],
              ["Company", result.companyName],
              ["Booking ID", result.bookingCode],
            ].map(([k, val]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:gap-8">
                <dt className="w-28 shrink-0 text-[16px] italic text-[#89171a]/75">{k}</dt>
                <dd className="text-[19px] text-[#2e0a0c]">{val}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={downloadIcs} className={primaryBtn}>
              <CalendarPlus size={19} /> Add to calendar
            </button>
            <Link href="/" className={ghostBtn}>
              Visit the Podversal website
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Form
  return (
    <section
      id="book"
      ref={sectionRef}
      style={{ ...SERIF, ...GRAIN }}
      className={`${sectionCls} pb-24 pt-14 sm:pt-24`}
    >
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        {/* About the session */}
        <div className="lg:sticky lg:top-12 lg:self-start">
          <h2 className="text-[clamp(2.9rem,8.5vw,5.1rem)] font-bold leading-[0.96] tracking-[-0.025em] text-[#89171a]">
            Your hour at the microphone
          </h2>
          <p className="mt-6 max-w-md text-[20px] leading-[1.6] text-[#2e0a0c]">
            A complimentary one-hour podcast session at Podversal Studio. Choose a date and a
            time and we’ll confirm it by email, then remind you the day before and again two
            hours ahead.
          </p>
          <dl className="mt-9 max-w-md divide-y divide-[#89171a]/20 border-y border-[#89171a]/20">
            {[
              ["Length", "One hour"],
              ["Open", "10 AM to 6 PM, every day"],
              ["Where", config?.venue ?? "Podversal Studio, Greater Noida West"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-6 py-3.5">
                <dt className="w-16 shrink-0 text-[16px] italic text-[#89171a]/75">{k}</dt>
                <dd className="text-[18px] leading-snug text-[#2e0a0c]">{v}</dd>
              </div>
            ))}
          </dl>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/founders/studio-set.svg"
            alt=""
            aria-hidden
            className="mt-14 hidden w-full max-w-[400px] lg:block"
          />
        </div>

        {/* The reply card */}
        <div
          style={GRAIN}
          className="relative bg-[#fffaf0] shadow-[0_1px_0_rgba(137,23,26,.1),0_36px_70px_-36px_rgba(70,10,12,.45)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-2 border border-[#89171a]/25 sm:inset-3"
          />

          <div className="relative px-6 py-10 sm:px-12 sm:py-14">
            {load === "loading" && (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-[#89171a]" role="status">
                <Loader2 className="animate-spin" size={26} />
                <p className="text-[19px] italic">
                  {slow
                    ? "Waking up the booking system. This can take up to a minute the first time."
                    : "Loading available times…"}
                </p>
              </div>
            )}

            {load === "error" && (
              <div role="alert" className="border border-[#89171a]/40 bg-[#89171a]/5 p-6 text-center">
                <p className="text-[19px] text-[#2e0a0c]">{loadError}</p>
                <button type="button" onClick={loadInitial} className={`${primaryBtn} mt-5`}>
                  Try again
                </button>
              </div>
            )}

            {load === "ready" && config && (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-14">
                {/* honeypot: hidden from people, irresistible to bots */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Website
                    <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
                  </label>
                </div>

                {/* Details */}
                <div className="space-y-7">
                  <GroupTitle>Your details</GroupTitle>
                  <Field id="companyName" label="Company name" error={errors.companyName?.message}>
                    <input
                      id="companyName"
                      autoComplete="organization"
                      className={inputCls}
                      placeholder="Acme Pvt. Ltd."
                      {...register("companyName")}
                    />
                  </Field>
                  <Field id="name" label="Your name" error={errors.name?.message}>
                    <input
                      id="name"
                      autoComplete="name"
                      className={inputCls}
                      placeholder="Full name"
                      {...register("name")}
                    />
                  </Field>
                  <div className="grid gap-7 sm:grid-cols-2">
                    <Field id="email" label="Email" error={errors.email?.message}>
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className={inputCls}
                        placeholder="you@company.com"
                        {...register("email")}
                      />
                    </Field>
                    <Field id="phone" label="Mobile number" error={errors.phone?.message}>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        className={inputCls}
                        placeholder="10-digit number"
                        {...register("phone")}
                      />
                    </Field>
                  </div>
                </div>

                {/* Date */}
                <div id="pick-date" className="scroll-mt-24 space-y-5">
                  <GroupTitle>Pick a date</GroupTitle>
                  <MonthCalendar days={days} value={date} onChange={pickDate} />
                  {pickError.date && (
                    <p role="alert" className="text-[15px] text-[#b3201f]">
                      {pickError.date}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div id="pick-time" className="scroll-mt-24 space-y-5">
                  <GroupTitle>Pick a time</GroupTitle>
                  {!date && (
                    <p className="text-center text-[18px] italic text-[#89171a]/70">
                      Choose a date first to see the times.
                    </p>
                  )}
                  {date && slotsError && !slotsLoading && (
                    <div role="alert" className="border border-[#89171a]/40 bg-[#89171a]/5 p-5">
                      <p className="text-[18px] text-[#2e0a0c]">{slotsError}</p>
                      <button
                        type="button"
                        onClick={() => fetchSlots(date)}
                        className={`${primaryBtn} mt-4 !min-h-[50px] !px-7 !text-[18px]`}
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  {date && !slotsError && (slotsLoading || !slots) && (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-[76px] animate-pulse bg-[#89171a]/10" />
                        ))}
                      </div>
                      <p role="status" className="text-center text-[17px] italic text-[#89171a]/80">
                        {slotsSlow
                          ? "Still loading. The booking system may be waking up, this can take a few seconds."
                          : "Loading times…"}
                      </p>
                    </>
                  )}
                  {date && slots && !slotsLoading && (
                    <>
                      <p className="text-center text-[18px] italic text-[#89171a]/85">
                        {formatDateLong(date)}
                      </p>
                      {slots.every((s) => !s.available) ? (
                        <p className="text-center text-[18px] text-[#2e0a0c]">
                          No times are left on this day. Please pick another date.
                        </p>
                      ) : (
                        <div
                          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                          role="radiogroup"
                          aria-label="Time slot"
                        >
                          {slots.map((s) => {
                            const selected = time === s.start;
                            const [clock, suffix] = formatTime12(s.start).split(" ");
                            return (
                              <button
                                key={s.start}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                aria-label={`${formatTime12(s.start)} to ${formatTime12(s.end)}${s.available ? "" : ", not available"}`}
                                disabled={!s.available}
                                onClick={() => {
                                  setTime(s.start);
                                  setPickError((p) => ({ ...p, time: undefined }));
                                }}
                                className={[
                                  "flex min-h-[76px] flex-col items-center justify-center border px-2 py-2 text-center transition-colors",
                                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#89171a]",
                                  selected
                                    ? "border-[#89171a] bg-[#89171a] text-[#faf5dc]"
                                    : s.available
                                      ? "border-[#89171a]/35 text-[#2e0a0c] hover:border-[#89171a] hover:bg-[#89171a]/[0.06]"
                                      : "cursor-not-allowed border-[#89171a]/12 text-[#89171a]/35",
                                ].join(" ")}
                              >
                                <span className="text-[26px] font-bold leading-none">
                                  {clock}
                                  <span className="ml-1 text-[15px] font-normal italic">{suffix}</span>
                                </span>
                                <span className="mt-1.5 text-[14px] italic opacity-80">
                                  {s.available ? `to ${formatTime12(s.end)}` : "Taken"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  {pickError.time && (
                    <p role="alert" className="text-[15px] text-[#b3201f]">
                      {pickError.time}
                    </p>
                  )}
                </div>

                {/* Reference: the team is the unit, both members light up together */}
                <fieldset className="space-y-4">
                  <legend className="w-full">
                    <GroupTitle>Who invited you?</GroupTitle>
                  </legend>
                  <p className="text-center text-[17px] italic text-[#89171a]/85">
                    {refFromLink
                      ? `We selected ${refFromLink} from your invitation link. Change it if that’s not right.`
                      : "Choose the team that invited you."}
                  </p>
                  <div>
                    {config.teams.map((team) => {
                      const selected = referredBy === team.id;
                      return (
                        <label
                          key={team.id}
                          className={`-mx-3 flex cursor-pointer flex-col gap-2.5 border-t border-[#89171a]/15 px-3 py-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#89171a] sm:flex-row sm:items-center sm:gap-6 ${
                            selected ? "bg-[#89171a]/[0.07]" : "hover:bg-[#89171a]/[0.035]"
                          }`}
                        >
                          {/* Controlled on purpose: what is highlighted, what is checked and
                              what gets submitted all come from the same value, so they can
                              never disagree. */}
                          <input
                            type="radio"
                            name="referredBy"
                            value={team.id}
                            checked={selected}
                            onChange={() =>
                              setValue("referredBy", team.id, { shouldValidate: true })
                            }
                            className="sr-only"
                          />
                          <span className="text-[19px] italic text-[#89171a] sm:w-52">
                            {team.name}
                          </span>
                          <span className="flex flex-wrap gap-2.5">
                            {team.members.map((m) => (
                              <span
                                key={m.id}
                                className={`inline-flex min-h-[46px] items-center border px-6 text-[19px] transition-colors ${
                                  selected
                                    ? "border-[#89171a] bg-[#89171a] text-[#faf5dc]"
                                    : "border-[#89171a]/35 text-[#2e0a0c]"
                                }`}
                              >
                                {m.name}
                              </span>
                            ))}
                          </span>
                        </label>
                      );
                    })}
                    <div className="border-t border-[#89171a]/15" />
                  </div>
                  {errors.referredBy && !referredBy && (
                    <p role="alert" className="text-[15px] text-[#b3201f]">
                      {errors.referredBy.message}
                    </p>
                  )}
                </fieldset>

                {/* Submit */}
                <div className="space-y-5 text-center">
                  {date && time && (
                    <p className="text-[21px] italic text-[#2e0a0c]">
                      {formatDateShort(date)}, {formatTime12(time)} to{" "}
                      {formatTime12(`${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00`)}
                    </p>
                  )}
                  {serverError && (
                    <div
                      role="alert"
                      className="border border-[#89171a]/40 bg-[#89171a]/[0.06] px-4 py-3 text-left text-[18px] text-[#2e0a0c]"
                    >
                      {serverError}
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className={`${primaryBtn} w-full sm:w-auto sm:min-w-[300px]`}>
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={19} /> Booking…
                      </>
                    ) : (
                      "Confirm my slot"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

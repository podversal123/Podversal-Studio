"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus, Loader2 } from "lucide-react";
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

const serif = { fontFamily: "var(--font-newsreader), Georgia, serif" };
const REF_KEY = "pv_founders_ref";

const schema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name"),
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  referredBy: z.string().min(1, "Choose who invited you"),
  website: z.string().optional(), // honeypot
});
type FormValues = z.infer<typeof schema>;

const inputCls =
  "w-full border-0 border-b border-[#89171a]/40 bg-transparent px-0 py-3 text-[17px] text-[#3a0b0d] placeholder:text-[#89171a]/40 transition-colors focus:border-[#89171a] focus:shadow-[0_1px_0_0_#89171a] focus:outline-none";

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
      <label htmlFor={id} className="block text-[15px] text-[#89171a]">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-[14px] text-[#b3201f]">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[1.5rem] italic leading-tight text-[#89171a]" style={serif}>
      {children}
    </h3>
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
      const known = cfg.teams.flatMap((t) => t.members).find((m) => m.id === ref);
      if (known) {
        setValue("referredBy", known.id);
        setRefFromLink(known.name);
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
    const slowTimer = quiet ? null : setTimeout(() => {
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
          err instanceof ApiError
            ? err.message
            : "We couldn't load the times. Please try again.",
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
        referredBy: v.referredBy,
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

  // ── Success
  if (result) {
    return (
      <section
        id="book"
        ref={sectionRef}
        className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-[#faf5dc] px-5 pb-20 pt-16 sm:rounded-t-[50%_6rem] sm:px-8"
      >
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-[clamp(2.2rem,7vw,3.4rem)] font-bold leading-[1.05] text-[#89171a]" style={serif}>
            You’re booked.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#3a0b0d]" style={serif}>
            Thank you, {result.name.split(" ")[0]}. We’ve emailed the details to{" "}
            <strong className="break-all">{result.email}</strong>. If it doesn’t show up in a few minutes, check your spam folder.
          </p>

          <dl className="mt-8 divide-y divide-[#89171a]/15 border-y border-[#89171a]/15 text-left">
            {[
              ["Date", formatDateLong(result.shootDate)],
              ["Time", `${formatTime12(result.startTime)} – ${formatTime12(result.endTime)}`],
              ["Where", result.venue],
              ["Company", result.companyName],
              ["Booking ID", result.bookingCode],
            ].map(([k, val]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-6">
                <dt className="w-28 shrink-0 text-[15px] text-[#89171a]/70">{k}</dt>
                <dd className="text-[17px] font-medium text-[#3a0b0d]">{val}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={downloadIcs}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#89171a] px-7 text-[17px] font-semibold text-[#faf5dc] transition-colors hover:bg-[#6f1215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a]"
            >
              <CalendarPlus size={18} /> Add to calendar
            </button>
            <Link
              href="/"
              className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-[#89171a]/50 px-7 text-[17px] text-[#89171a] transition-colors hover:bg-[#89171a]/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a]"
            >
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
      className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-[#faf5dc] px-5 pb-24 pt-14 sm:rounded-t-[50%_6rem] sm:px-8 sm:pt-24 lg:px-12"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        {/* About the session */}
        <div className="lg:sticky lg:top-12 lg:self-start">
          <h2
            className="text-[clamp(2rem,6.5vw,3.3rem)] font-bold leading-[1.08] text-[#89171a]"
            style={serif}
          >
            Choose a time for your episode
          </h2>
          <p className="mt-4 max-w-md text-[18px] leading-[1.65] text-[#3a0b0d]" style={serif}>
            A complimentary one-hour podcast session at Podversal Studio. Pick a slot and we’ll
            confirm it by email, then remind you the day before and again two hours ahead.
          </p>
          <dl className="mt-8 max-w-md divide-y divide-[#89171a]/15 border-y border-[#89171a]/15">
            {[
              ["Length", "1 hour"],
              ["Open", "10 AM to 6 PM, every day"],
              ["Where", config?.venue ?? "Podversal Studio, Greater Noida West"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-5 py-3">
                <dt className="w-16 shrink-0 text-[15px] text-[#89171a]/70">{k}</dt>
                <dd className="text-[16px] text-[#3a0b0d]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The reply card */}
        <div>
          {load === "loading" && (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-[#89171a]" role="status">
              <Loader2 className="animate-spin" size={26} />
              <p className="text-[17px]" style={serif}>
                {slow
                  ? "Waking up the booking system. This can take up to a minute the first time."
                  : "Loading available times…"}
              </p>
            </div>
          )}

          {load === "error" && (
            <div role="alert" className="border border-[#89171a]/40 bg-[#89171a]/5 p-6 text-center">
              <p className="text-[17px] text-[#3a0b0d]">{loadError}</p>
              <button
                type="button"
                onClick={loadInitial}
                className="mt-4 min-h-[48px] rounded-full bg-[#89171a] px-7 text-[16px] font-semibold text-[#faf5dc] hover:bg-[#6f1215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a]"
              >
                Try again
              </button>
            </div>
          )}

          {load === "ready" && config && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-12">
              {/* honeypot: hidden from people, irresistible to bots */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
                </label>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <SectionTitle>Your details</SectionTitle>
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
                <div className="grid gap-6 sm:grid-cols-2">
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
              <div id="pick-date" className="scroll-mt-24 space-y-4">
                <SectionTitle>Pick a date</SectionTitle>
                <MonthCalendar days={days} value={date} onChange={pickDate} />
                {pickError.date && (
                  <p role="alert" className="text-[14px] text-[#b3201f]">
                    {pickError.date}
                  </p>
                )}
              </div>

              {/* Time */}
              <div id="pick-time" className="scroll-mt-24 space-y-4">
                <SectionTitle>Pick a time</SectionTitle>
                {!date && (
                  <p className="text-[16px] text-[#89171a]/70">Choose a date first to see the times.</p>
                )}
                {date && slotsError && !slotsLoading && (
                  <div role="alert" className="border border-[#89171a]/40 bg-[#89171a]/5 p-5">
                    <p className="text-[16px] text-[#3a0b0d]">{slotsError}</p>
                    <button
                      type="button"
                      onClick={() => fetchSlots(date)}
                      className="mt-3 min-h-[46px] rounded-full bg-[#89171a] px-6 text-[16px] font-semibold text-[#faf5dc] hover:bg-[#6f1215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a]"
                    >
                      Try again
                    </button>
                  </div>
                )}
                {date && !slotsError && (slotsLoading || !slots) && (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[66px] animate-pulse bg-[#89171a]/10" />
                      ))}
                    </div>
                    <p role="status" className="text-[15px] text-[#89171a]/80">
                      {slotsSlow
                        ? "Still loading. The booking system may be waking up, this can take a few seconds."
                        : "Loading times…"}
                    </p>
                  </>
                )}
                {date && slots && !slotsLoading && (
                  <>
                    <p className="text-[16px] text-[#89171a]/80">{formatDateLong(date)}</p>
                    {slots.every((s) => !s.available) ? (
                      <p className="text-[16px] text-[#3a0b0d]">
                        No times are left on this day. Please pick another date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Time slot">
                        {slots.map((s) => {
                          const selected = time === s.start;
                          return (
                            <button
                              key={s.start}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              disabled={!s.available}
                              onClick={() => {
                                setTime(s.start);
                                setPickError((p) => ({ ...p, time: undefined }));
                              }}
                              className={[
                                "flex min-h-[66px] flex-col items-center justify-center border px-2 py-2 text-center transition-colors",
                                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#89171a]",
                                selected
                                  ? "border-[#89171a] bg-[#89171a] text-[#faf5dc]"
                                  : s.available
                                    ? "border-[#89171a]/40 text-[#3a0b0d] hover:border-[#89171a] hover:bg-[#89171a]/8"
                                    : "cursor-not-allowed border-[#89171a]/15 text-[#89171a]/35",
                              ].join(" ")}
                            >
                              <span className={`text-[17px] font-semibold ${!s.available ? "line-through" : ""}`}>
                                {formatTime12(s.start)}
                              </span>
                              <span className="text-[13px] opacity-80">
                                {s.available ? `to ${formatTime12(s.end)}` : "Not available"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {pickError.time && (
                  <p role="alert" className="text-[14px] text-[#b3201f]">
                    {pickError.time}
                  </p>
                )}
              </div>

              {/* Reference */}
              <fieldset className="space-y-2">
                <legend className="mb-2">
                  <SectionTitle>Who invited you?</SectionTitle>
                </legend>
                {refFromLink && (
                  <p className="text-[15px] text-[#89171a]/80">
                    We selected {refFromLink} from your invitation link. Change it if that’s not right.
                  </p>
                )}
                <div>
                  {config.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col gap-2 border-t border-[#89171a]/15 py-3 sm:flex-row sm:items-center sm:gap-5"
                    >
                      <span className="text-[1.1rem] italic text-[#89171a] sm:w-48" style={serif}>
                        {team.name}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((m) => (
                          <label key={m.id} className="cursor-pointer">
                            <input
                              type="radio"
                              value={m.id}
                              className="peer sr-only"
                              {...register("referredBy")}
                            />
                            <span className="inline-flex min-h-[44px] items-center rounded-full border border-[#89171a]/40 px-5 text-[16px] text-[#3a0b0d] transition-colors hover:border-[#89171a] peer-checked:border-[#89171a] peer-checked:bg-[#89171a] peer-checked:text-[#faf5dc] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#89171a]">
                              {m.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#89171a]/15" />
                </div>
                {errors.referredBy && !referredBy && (
                  <p role="alert" className="text-[14px] text-[#b3201f]">
                    {errors.referredBy.message}
                  </p>
                )}
              </fieldset>

              {/* Submit */}
              <div className="space-y-4">
                {date && time && (
                  <p className="text-[17px] text-[#3a0b0d]" style={serif}>
                    {formatDateShort(date)}, {formatTime12(time)} to{" "}
                    {formatTime12(`${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00`)}
                  </p>
                )}
                {serverError && (
                  <div role="alert" className="border border-[#89171a]/40 bg-[#89171a]/6 px-4 py-3 text-[16px] text-[#3a0b0d]">
                    {serverError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#89171a] px-8 text-[18px] font-semibold text-[#faf5dc] transition-colors hover:bg-[#6f1215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#89171a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[260px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Booking…
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
    </section>
  );
}

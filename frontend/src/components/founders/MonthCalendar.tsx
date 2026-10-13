"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FounderDay } from "./founders-api";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const ym = (date: string) => date.slice(0, 7);

interface Props {
  days: FounderDay[]; // bookable window, starting today (IST)
  value: string | null;
  onChange: (date: string) => void;
}

export default function MonthCalendar({ days, value, onChange }: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const today = days[0]?.date;
  const firstMonth = today ? ym(today) : "";
  const lastMonth = days.length ? ym(days[days.length - 1].date) : "";

  const [view, setView] = useState(() => {
    const start = value ?? today ?? new Date().toISOString().slice(0, 10);
    return { year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 };
  });

  const viewKey = `${view.year}-${pad(view.month + 1)}`;
  const canPrev = viewKey > firstMonth;
  const canNext = viewKey < lastMonth;

  const shift = (delta: number) =>
    setView((v) => {
      const d = new Date(Date.UTC(v.year, v.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });

  // Monday-first grid
  const offset = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <h4
          className="text-[1.75rem] font-bold leading-none tracking-[-0.01em] text-[#89171a]"
          aria-live="polite"
        >
          {MONTHS[view.month]} {view.year}
        </h4>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={!canPrev}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#89171a] transition-colors hover:bg-[#89171a]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#89171a] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={!canNext}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#89171a] transition-colors hover:bg-[#89171a]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#89171a] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-3 text-[15px] italic text-[#89171a]/65">
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const date = `${viewKey}-${pad(day)}`;
          const info = byDate.get(date);
          const bookable = !!info && info.available > 0;
          const full = !!info && info.available === 0;
          const selected = value === date;
          const isToday = date === today;

          const label = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          });

          return (
            <div key={date} className="flex justify-center">
              <button
                type="button"
                disabled={!bookable}
                onClick={() => onChange(date)}
                aria-pressed={selected}
                aria-label={
                  !info
                    ? `${label}, not available`
                    : full
                      ? `${label}, fully booked`
                      : `${label}, ${info.available} ${info.available === 1 ? "time" : "times"} free`
                }
                className={[
                  "relative flex aspect-square w-full max-w-[48px] items-center justify-center rounded-full text-[20px] transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#89171a]",
                  selected
                    ? "bg-[#89171a] font-bold text-[#faf5dc]"
                    : bookable
                      ? "text-[#2e0a0c] hover:bg-[#89171a]/10"
                      : full
                        ? "cursor-not-allowed text-[#89171a]/35 line-through decoration-[#89171a]/40"
                        : "cursor-not-allowed text-[#89171a]/20",
                ].join(" ")}
              >
                {day}
                {isToday && (
                  <span
                    aria-hidden
                    className={`absolute bottom-[5px] h-[3px] w-[3px] rounded-full ${selected ? "bg-[#faf5dc]" : "bg-[#89171a]"}`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

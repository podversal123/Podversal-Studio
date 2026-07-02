"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";

const SERVICE_COLORS: Record<string, string> = {
  PODCAST: "#7c3aed",
  VFX_PODCAST: "#2563eb",
  MONOLOGUE: "#16a34a",
  NEWS_SHOOT: "#dc2626",
  ONLINE_CLASS: "#d97706",
  PRODUCT_SHOOT: "#db2777",
};

const SERVICE_LABELS: Record<string, string> = {
  PODCAST: "Podcast",
  VFX_PODCAST: "VFX Podcast",
  MONOLOGUE: "Monologue",
  NEWS_SHOOT: "News Shoot",
  ONLINE_CLASS: "Online Class",
  PRODUCT_SHOOT: "Product Shoot",
};

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  // Starts false to match the server-rendered markup, then flips after mount
  // based on actual viewport width  avoids a hydration mismatch.
  const [isMobile, setIsMobile] = useState(false);
  const wasMobile = useRef(false);

  // When any booking is created, updated, or payment confirmed  refresh calendar immediately
  useEffect(() => {
    const handler = () => calendarRef.current?.getApi().refetchEvents();
    window.addEventListener("podversal:live", handler);
    return () => window.removeEventListener("podversal:live", handler);
  }, []);

  // 6 toolbar buttons in one row overflow small screens  switch to a 2-row
  // toolbar (view buttons in the footer) and default to the single-day view
  // below the sm breakpoint. Desktop layout is untouched.
  useEffect(() => {
    const checkSize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile !== wasMobile.current) {
        wasMobile.current = mobile;
        calendarRef.current
          ?.getApi()
          ?.changeView(mobile ? "timeGridDay" : "timeGridWeek");
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const fetchEvents = async (info: any, successCb: any, failureCb: any) => {
    try {
      const from = info.startStr.split("T")[0];
      const to = info.endStr.split("T")[0];
      const res = await api.get("/calendar/events", { params: { from, to } });
      successCb(
        res.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          start: `${e.date}T${e.startTime}`,
          end: `${e.date}T${e.endTime}`,
          backgroundColor: SERVICE_COLORS[e.serviceType] ?? "#6b7280",
          borderColor: SERVICE_COLORS[e.serviceType] ?? "#6b7280",
          extendedProps: e,
        })),
      );
    } catch {
      toast.error("Failed to load calendar events");
      failureCb();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Studio Schedule
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Calendar
          </h1>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {Object.entries(SERVICE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 flex-shrink-0"
                style={{ backgroundColor: SERVICE_COLORS[type] }}
              />
              <span className="text-[11px] font-bold text-[#6b6b6b] dark:text-[#8a8a8a]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] p-2 sm:p-4 overflow-x-auto">
        <div className="min-w-[320px]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={
              isMobile
                ? { left: "prev,next", center: "title", right: "today" }
                : {
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }
            }
            footerToolbar={
              isMobile
                ? {
                    left: "dayGridMonth,timeGridWeek,timeGridDay",
                    center: "",
                    right: "",
                  }
                : undefined
            }
            slotMinTime="06:00:00"
            slotMaxTime="26:00:00"
            allDaySlot={false}
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }}
            events={fetchEvents}
            eventClick={(info) =>
              router.push(`/dashboard/bookings/${info.event.id}`)
            }
            height="auto"
            nowIndicator
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: "06:00",
              endTime: "26:00",
            }}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const SERVICE_TYPE_COLORS: Record<string, string> = {
  PODCAST:       '#7c3aed',
  VFX_PODCAST:   '#2563eb',
  MONOLOGUE:     '#16a34a',
  NEWS_SHOOT:    '#dc2626',
  ONLINE_CLASS:  '#d97706',
  PRODUCT_SHOOT: '#db2777',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  PODCAST:       'Podcast',
  VFX_PODCAST:   'VFX Podcast',
  MONOLOGUE:     'Monologue',
  NEWS_SHOOT:    'News Shoot',
  ONLINE_CLASS:  'Online Class',
  PRODUCT_SHOOT: 'Product Shoot',
};

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);

  const fetchEvents = async (info: any, successCb: any, failureCb: any) => {
    try {
      const from = info.startStr.split('T')[0];
      const to = info.endStr.split('T')[0];
      const res = await api.get('/calendar/events', { params: { from, to } });

      const events = res.data.map((e: any) => ({
        id:              e.id,
        title:           e.title,
        start:           `${e.date}T${e.startTime}`,
        end:             `${e.date}T${e.endTime}`,
        backgroundColor: SERVICE_TYPE_COLORS[e.serviceType] ?? '#6b7280',
        borderColor:     SERVICE_TYPE_COLORS[e.serviceType] ?? '#6b7280',
        extendedProps:   e,
      }));

      successCb(events);
    } catch {
      toast.error('Failed to load calendar events');
      failureCb();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">Studio schedule and booking overview</p>
      </div>

      {/* Legend — color-coded by service type per document requirement */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(SERVICE_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {SERVICE_TYPE_LABELS[type] ?? type}
          </div>
        ))}
      </div>

      <div className="card p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          slotMinTime="06:00:00"
          slotMaxTime="26:00:00"
          allDaySlot={false}
          events={fetchEvents}
          eventClick={(info) => {
            router.push(`/dashboard/bookings/${info.event.id}`);
          }}
          height="auto"
          businessHours={{ daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '06:00', endTime: '26:00' }}
          nowIndicator
        />
      </div>
    </div>
  );
}

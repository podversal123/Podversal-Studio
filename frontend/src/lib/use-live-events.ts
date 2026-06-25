'use client';

import { useEffect, useRef } from 'react';
import { getStoredUser } from './auth';

export type LiveEventType = 'booking.created' | 'booking.updated' | 'payment.confirmed';

export interface LiveEvent {
  type:      LiveEventType;
  bookingId: string;
  status?:   string;
  userId?:   string;
}

export function useLiveEvents(onEvent: (e: LiveEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url  = `${base}/events?token=${encodeURIComponent(token)}`;

    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(url);

      es.onmessage = (raw) => {
        try {
          const event: LiveEvent = JSON.parse(raw.data);

          // CUSTOMER and REFERRAL_AGENT: only process events that belong to them
          const user = getStoredUser();
          if (user && (user.role === 'CUSTOMER' || user.role === 'REFERRAL_AGENT')) {
            if (event.userId && event.userId !== user.id) return;
          }

          handlerRef.current(event);
        } catch {}
      };

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimer);
    };
  }, []);
}

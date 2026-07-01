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
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    let es: EventSource | undefined;
    let retryTimer: ReturnType<typeof setTimeout>;
    let stopped = false;

    // Re-read the token from localStorage on every (re)connect attempt instead
    // of once at mount, so a refreshed access_token (rotated by the axios
    // interceptor in lib/api.ts) is picked up instead of retrying forever
    // against the same stale token.
    const connect = () => {
      if (stopped) return;
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${base}/events?token=${encodeURIComponent(token)}`;
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
        es?.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      stopped = true;
      es?.close();
      clearTimeout(retryTimer);
    };
  }, []);
}

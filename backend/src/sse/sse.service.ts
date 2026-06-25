import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type SseEventType =
  | 'booking.created'
  | 'booking.updated'
  | 'payment.confirmed';

export interface SseEvent {
  type:      SseEventType;
  bookingId: string;
  status?:   string;
  userId?:   string; // owner of the booking — frontend uses this to skip unrelated events
}

@Injectable()
export class SseService {
  private readonly subject = new Subject<SseEvent>();

  readonly events$ = this.subject.asObservable();

  emit(event: SseEvent): void {
    this.subject.next(event);
  }
}

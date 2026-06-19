import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendar: CalendarService) {}

  // GET /api/calendar/events?start=2026-06-01&end=2026-06-30
  // Accepts both FullCalendar format (start/end) and manual (from/to)
  @Get('events')
  getEvents(
    @Query('start') start: string,
    @Query('end')   end: string,
    @Query('from')  from: string,
    @Query('to')    to: string,
  ) {
    return this.calendar.getEvents(start ?? from, end ?? to);
  }

  // GET /api/calendar/booked-slots?date=2026-06-20
  @Get('booked-slots')
  getBookedSlots(@Query('date') date: string) {
    return this.calendar.getBookedSlots(date);
  }
}

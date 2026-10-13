import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { FoundersService } from "./founders.service";
import { CreateFounderBookingDto } from "./dto/founder.dto";

// Public endpoints for the /founders landing page (no login).
// Responses never contain anyone's personal data — only free/taken flags.
@Controller("founders")
export class FoundersController {
  constructor(private founders: FoundersService) {}

  // GET /api/founders/config
  @Get("config")
  config() {
    return this.founders.getConfig();
  }

  // GET /api/founders/days  → free-slot count for each day in the booking window
  @Get("days")
  days() {
    return this.founders.getDays();
  }

  // GET /api/founders/slots?date=2026-10-14
  @Get("slots")
  slots(@Query("date") date: string) {
    return this.founders.getSlots(date);
  }

  // POST /api/founders/book
  @Post("book")
  book(@Body() dto: CreateFounderBookingDto, @Req() req: any) {
    return this.founders.book(dto, req.ip);
  }
}

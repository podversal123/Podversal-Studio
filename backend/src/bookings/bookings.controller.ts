import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BookingStatus, Role } from "@prisma/client";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { SendQuoteDto } from "./dto/send-quote.dto";
import { AssignEmployeeDto } from "./dto/assign-employee.dto";
import { JwtAuthGuard } from "../common/guards/jwt.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  // GET /api/bookings/availability?date=2026-06-20&startTime=09:00&endTime=12:00
  @Get("availability")
  checkAvailability(
    @Query("date") date: string,
    @Query("startTime") startTime: string,
    @Query("endTime") endTime: string,
  ) {
    return this.bookings.checkAvailability(date, startTime, endTime);
  }

  // GET /api/bookings
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query("date") date?: string,
    @Query("status") status?: BookingStatus,
  ) {
    return this.bookings.findAll(user.id, user.role, { date, status });
  }

  // GET /api/bookings/:id  ownership enforced per role
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.bookings.findOne(id, user.id, user.role);
  }

  // POST /api/bookings
  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookings.create(dto, user.id, user.role);
  }

  // PATCH /api/bookings/:id/quote  STUDIO_MANAGER, SUPER_ADMIN
  @Patch(":id/quote")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  sendQuote(@Param("id") id: string, @Body() dto: SendQuoteDto) {
    return this.bookings.sendQuote(id, dto);
  }

  // PATCH /api/bookings/:id/approve
  @Patch(":id/approve")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  approve(@Param("id") id: string) {
    return this.bookings.approve(id);
  }

  // PATCH /api/bookings/:id/cancel
  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @CurrentUser() user: any) {
    return this.bookings.cancel(id, user.id, user.role as Role);
  }

  // PATCH /api/bookings/:id/assign-employee  STUDIO_MANAGER, SUPER_ADMIN
  @Patch(":id/assign-employee")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  assignEmployee(@Param("id") id: string, @Body() dto: AssignEmployeeDto) {
    return this.bookings.assignEmployee(id, dto);
  }

  // PATCH /api/bookings/:id/start  mark IN_PROGRESS
  @Patch(":id/start")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER", "EMPLOYEE")
  markInProgress(@Param("id") id: string) {
    return this.bookings.markInProgress(id);
  }

  // PATCH /api/bookings/:id/complete  mark COMPLETED
  @Patch(":id/complete")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER", "EMPLOYEE")
  markCompleted(@Param("id") id: string) {
    return this.bookings.markCompleted(id);
  }
}

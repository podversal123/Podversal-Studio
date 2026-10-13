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
import { FoundersService } from "./founders.service";
import { UpdateFounderStatusDto } from "./dto/founder.dto";
import { JwtAuthGuard } from "../common/guards/jwt.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

// Admin side of the founders campaign.
// Bookings: SUPER_ADMIN + STUDIO_MANAGER. Leaderboard (incentives): SUPER_ADMIN only.
@Controller("founders/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FoundersAdminController {
  constructor(private founders: FoundersService) {}

  @Get("bookings")
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  list(
    @Query("status") status?: string,
    @Query("referredBy") referredBy?: string,
    @Query("date") date?: string,
  ) {
    return this.founders.list({ status, referredBy, date });
  }

  @Get("leaderboard")
  @Roles("SUPER_ADMIN")
  leaderboard() {
    return this.founders.leaderboard();
  }

  @Patch("bookings/:id/status")
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateFounderStatusDto) {
    return this.founders.updateStatus(id, dto.status);
  }

  @Post("bookings/:id/resend-confirmation")
  @Roles("SUPER_ADMIN", "STUDIO_MANAGER")
  resend(@Param("id") id: string) {
    return this.founders.resendConfirmation(id);
  }
}

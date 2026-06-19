import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  // GET /api/dashboard/stats — Admin & Manager KPIs
  @Get('stats')
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  getStats() {
    return this.dashboard.getAdminStats();
  }
}

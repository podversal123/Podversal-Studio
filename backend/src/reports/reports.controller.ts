import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('bookings')
  getBookings(@Query('from') from: string, @Query('to') to: string) {
    return this.reports.getBookingReport(from, to);
  }

  @Get('bookings/export')
  async exportBookings(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const pdf = await this.reports.exportBookingReportPdf(from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="booking-report-${from}-${to}.pdf"`);
    res.send(pdf);
  }

  @Get('revenue')
  getRevenue(@Query('from') from: string, @Query('to') to: string) {
    return this.reports.getRevenueReport(from, to);
  }

  @Get('revenue/export')
  async exportRevenue(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const pdf = await this.reports.exportRevenueReportPdf(from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${from}-${to}.pdf"`);
    res.send(pdf);
  }

  @Get('gst')
  getGst(@Query('from') from: string, @Query('to') to: string) {
    return this.reports.getGstReport(from, to);
  }

  @Get('gst/export')
  async exportGst(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const pdf = await this.reports.exportGstReportPdf(from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gst-report-${from}-${to}.pdf"`);
    res.send(pdf);
  }
}

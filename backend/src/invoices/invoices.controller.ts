import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InvoiceType } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsEnum, IsString } from 'class-validator';

class GenerateInvoiceDto {
  @IsString()
  bookingId: string;

  @IsEnum(InvoiceType)
  type: InvoiceType;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  // POST /api/invoices/generate — SUPER_ADMIN, STUDIO_MANAGER only
  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  generate(@Body() dto: GenerateInvoiceDto) {
    return this.invoices.generate(dto.bookingId, dto.type);
  }

  // GET /api/invoices/booking/:bookingId
  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.invoices.findByBooking(bookingId);
  }
}

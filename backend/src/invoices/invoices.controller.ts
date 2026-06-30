import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceType } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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

  // POST /api/invoices/generate — admin roles + customers (own bookings only)
  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER', 'CUSTOMER')
  generate(@Body() dto: GenerateInvoiceDto, @CurrentUser() user: any) {
    return this.invoices.generate(dto.bookingId, dto.type, user.id, user.role);
  }

  // GET /api/invoices/booking/:bookingId — ownership enforced per role
  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.invoices.findByBooking(bookingId, user.id, user.role);
  }

  // GET /api/invoices/:id/pdf — streams PDF directly, no Cloudinary auth issues
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @CurrentUser() user: any, @Res() res: Response) {
    const { buffer, invoiceNumber } = await this.invoices.streamPdf(id, user.id, user.role);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}

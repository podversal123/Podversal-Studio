import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyRazorpayDto } from './dto/verify-razorpay.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  // POST /api/payments/razorpay/order — creates Razorpay order for online payment
  @Post('razorpay/order')
  @UseGuards(JwtAuthGuard)
  createOrder(@Body() dto: CreatePaymentDto) {
    return this.payments.createRazorpayOrder(dto);
  }

  // POST /api/payments/razorpay/verify — verifies Razorpay signature after payment
  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard)
  verifyPayment(@Body() dto: VerifyRazorpayDto) {
    return this.payments.verifyRazorpay(dto);
  }

  // POST /api/payments/offline — cash or bank transfer entry by staff
  @Post('offline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  recordOffline(@Body() dto: CreatePaymentDto) {
    return this.payments.recordOfflinePayment(dto);
  }

  // GET /api/payments/booking/:bookingId — all payments for a booking
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  getByBooking(@Param('bookingId') bookingId: string) {
    return this.payments.findByBooking(bookingId);
  }

  // POST /api/payments/webhook — Razorpay webhook (no auth — Razorpay calls this)
  @Post('webhook')
  handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.payments.handleWebhook(body, signature);
  }
}

import { IsString } from 'class-validator';

export class VerifyRazorpayDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;

  @IsString()
  bookingId: string;

  @IsString()
  paymentDbId: string;
}

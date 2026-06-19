import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMode, PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  bookingId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsEnum(PaymentMode)
  @IsOptional()
  mode?: PaymentMode;

  // For offline payments (cash / bank transfer)
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  collectedBy?: string;
}

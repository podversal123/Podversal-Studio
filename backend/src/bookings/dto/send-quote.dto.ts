import { IsNumber, IsOptional, Min } from 'class-validator';

export class SendQuoteDto {
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;
}

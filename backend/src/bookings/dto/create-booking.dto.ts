import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  customerName: string;

  @IsString()
  customerEmail: string;

  @IsString()
  customerPhone: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  serviceId: string;

  @IsDateString()
  shootDate: string;

  @IsString()
  startTime: string; // "09:00"

  @IsString()
  endTime: string;   // "12:00"

  @IsNumber()
  @Min(0.5)
  durationHours: number;

  @IsString()
  @IsOptional()
  studioRequirements?: string;

  @IsString()
  @IsOptional()
  equipmentRequired?: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  @IsString()
  @IsOptional()
  agentId?: string;
}

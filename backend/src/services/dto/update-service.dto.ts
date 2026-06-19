import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerHour?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minDuration?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

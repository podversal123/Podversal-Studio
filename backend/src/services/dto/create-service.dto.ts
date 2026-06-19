import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateServiceDto {
  @IsEnum(ServiceType)
  type: ServiceType;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @IsNumber()
  @Min(1)
  minDuration: number;
}

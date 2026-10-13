import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";
import { FOUNDER_REFERRER_IDS } from "../founders.constants";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateFounderBookingDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120, { message: "Company name must be 2–120 characters" })
  companyName: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100, { message: "Name must be 2–100 characters" })
  name: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "Enter a valid email address" })
  email: string;

  @Transform(trim)
  @Matches(/^[6-9]\d{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number",
  })
  phone: string;

  @IsIn(FOUNDER_REFERRER_IDS, { message: "Select who referred you" })
  referredBy: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date" })
  shootDate: string;

  @Matches(/^\d{2}:00$/, { message: "Invalid time slot" })
  startTime: string;

  // Honeypot: real users never see or fill this. Bots do.
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateFounderStatusDto {
  @IsIn(["COMPLETED", "CANCELLED"], {
    message: "Status must be COMPLETED or CANCELLED",
  })
  status: "COMPLETED" | "CANCELLED";
}

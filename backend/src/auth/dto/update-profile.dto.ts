import { IsOptional, IsString, Length } from "class-validator";

// Only these two fields can ever be changed through PATCH /auth/profile.
// (The global ValidationPipe has whitelist + forbidNonWhitelisted on, so any
// other field - role, isActive, email, password... - is rejected with a 400.)
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;
}

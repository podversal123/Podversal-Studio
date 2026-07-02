import { IsString } from 'class-validator';
import { RegisterDto } from './register.dto';

export class SetupAdminDto extends RegisterDto {
  // Must match the SETUP_SECRET env var — closes the open first-admin-takeover window
  @IsString()
  setupSecret: string;
}

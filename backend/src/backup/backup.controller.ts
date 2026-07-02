import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private backup: BackupService) {}

  // POST /api/backup/run  SUPER_ADMIN only, triggers an on-demand backup
  // (in addition to the automatic 3 AM daily backup)
  @Post('run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  run() {
    return this.backup.backupNow();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  // Runs every day at 3:00 AM  exports all business data and stores it
  // both on Cloudinary and as an email attachment, so data survives a
  // server/database crash.
  @Cron('0 3 * * *')
  async runDailyBackup() {
    try {
      await this.backupNow();
    } catch (err: any) {
      this.logger.error(`Backup failed: ${err?.message ?? err}`);
    }
  }

  async backupNow(): Promise<{ fileName: string; sizeKB: number; cloudinaryUrl: string }> {
    const [
      users, customers, agents, employees, services,
      bookings, payments, invoices, commissions,
      blogs, studioVideos, galleryImages,
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.customer.findMany(),
      this.prisma.agent.findMany(),
      this.prisma.employee.findMany(),
      this.prisma.service.findMany(),
      this.prisma.booking.findMany(),
      this.prisma.payment.findMany(),
      this.prisma.invoice.findMany(),
      this.prisma.commission.findMany(),
      this.prisma.blog.findMany(),
      this.prisma.studioVideo.findMany(),
      this.prisma.galleryImage.findMany(),
    ]);

    const backup = {
      generatedAt: new Date().toISOString(),
      users, customers, agents, employees, services,
      bookings, payments, invoices, commissions,
      blogs, studioVideos, galleryImages,
    };

    const json = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fileName = `podversal-backup-${dateStr}.json`;
    const sizeKB = Math.round(Buffer.byteLength(json) / 1024);

    const base64 = Buffer.from(json).toString('base64');
    const uploadResult = await cloudinary.uploader.upload(
      `data:application/json;base64,${base64}`,
      {
        resource_type: 'raw',
        folder: 'podversal-backups',
        public_id: `backup-${dateStr}`,
        overwrite: true,
      },
    );

    await this.pruneOldBackups();

    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'podversalstudio@gmail.com';
    await this.notifications
      .sendBackupEmail(adminEmail, fileName, base64, sizeKB)
      .catch((err) => this.logger.error(`Backup email failed: ${err?.message ?? err}`));

    this.logger.log(`Backup complete: ${fileName} (${sizeKB} KB) -> ${uploadResult.secure_url}`);

    return { fileName, sizeKB, cloudinaryUrl: uploadResult.secure_url };
  }

  // Keeps only the last 30 days of backups on Cloudinary so free-tier storage never fills up
  private async pruneOldBackups() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    try {
      const { resources } = await cloudinary.api.resources({
        resource_type: 'raw',
        type: 'upload',
        prefix: 'podversal-backups/backup-',
        max_results: 100,
      });

      const stale = (resources ?? []).filter(
        (r: any) => new Date(r.created_at) < cutoff,
      );
      if (stale.length > 0) {
        await cloudinary.api.delete_resources(
          stale.map((r: any) => r.public_id),
          { resource_type: 'raw' },
        );
        this.logger.log(`Pruned ${stale.length} backup(s) older than 30 days`);
      }
    } catch (err: any) {
      this.logger.error(`Prune old backups failed: ${err?.message ?? err}`);
    }
  }
}

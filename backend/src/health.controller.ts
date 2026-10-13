import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

const DB_PING_TIMEOUT_MS = 3000;

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  // Pinged every few minutes by UptimeRobot (and by Render's health check).
  // Besides keeping the server awake, a tiny query keeps a live database
  // connection open, so the first visitor after a quiet spell does not wait
  // several seconds for a cold connection.
  //
  // It ALWAYS answers 200: Render restarts a service whose health check fails,
  // and a brief database blip must not trigger that. The database state is
  // reported in `db` instead ("ok" | "slow" | "error").
  @Get()
  async check() {
    let db: 'ok' | 'slow' | 'error' = 'ok';
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('slow')), DB_PING_TIMEOUT_MS),
        ),
      ]);
    } catch (err: any) {
      db = err?.message === 'slow' ? 'slow' : 'error';
    }
    return { status: 'ok', db, timestamp: new Date().toISOString() };
  }
}

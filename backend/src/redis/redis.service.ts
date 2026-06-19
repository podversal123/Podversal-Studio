import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    // If REDIS_URL is set (Upstash production), use that
    // Otherwise use host/port (local Docker)
    const redisUrl = this.config.get<string>('REDIS_URL');

    if (redisUrl) {
      // Production — Upstash gives a full URL like:
      // rediss://default:password@host:port
      this.client = new Redis(redisUrl, {
        tls: {}, // Upstash requires TLS
        maxRetriesPerRequest: 3,
      });
    } else {
      // Local development — Docker Redis
      this.client = new Redis({
        host: this.config.get<string>('REDIS_HOST') || 'localhost',
        port: this.config.get<number>('REDIS_PORT') || 6379,
        maxRetriesPerRequest: 3,
      });
    }

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─────────────────────────────────────────
  // SLOT LOCKING — core feature
  // Locks a time slot for 10 minutes when
  // a customer selects it during booking
  // ─────────────────────────────────────────

  // Lock a slot — returns true if lock acquired, false if already locked
  async lockSlot(slotKey: string, userId: string): Promise<boolean> {
    // NX = only set if key does NOT exist (prevents overwriting existing lock)
    // EX = expire after 600 seconds (10 minutes)
    const result = await this.client.set(slotKey, userId, 'EX', 600, 'NX');
    return result === 'OK';
  }

  // Check who holds the lock on a slot
  async getSlotLock(slotKey: string): Promise<string | null> {
    return this.client.get(slotKey);
  }

  // Release a slot lock (when booking is cancelled or completed)
  async releaseSlot(slotKey: string): Promise<void> {
    await this.client.del(slotKey);
  }

  // Check if a slot is currently locked by anyone
  async isSlotLocked(slotKey: string): Promise<boolean> {
    const value = await this.client.get(slotKey);
    return value !== null;
  }

  // ─────────────────────────────────────────
  // OTP STORAGE
  // Store OTP for 5 minutes, auto-expire
  // ─────────────────────────────────────────

  async saveOtp(phone: string, otp: string): Promise<void> {
    // OTP expires in 5 minutes (300 seconds)
    await this.client.set(`otp:${phone}`, otp, 'EX', 300);
  }

  async getOtp(phone: string): Promise<string | null> {
    return this.client.get(`otp:${phone}`);
  }

  async deleteOtp(phone: string): Promise<void> {
    await this.client.del(`otp:${phone}`);
  }

  // ─────────────────────────────────────────
  // GENERAL PURPOSE
  // ─────────────────────────────────────────

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

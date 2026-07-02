import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import * as crypto from "crypto";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL");

    const retryStrategy = (times: number) => Math.min(times * 500, 10000);

    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        tls: {},
        maxRetriesPerRequest: 3,
        retryStrategy,
        keepAlive: 10000,
        reconnectOnError: () => true,
        enableOfflineQueue: true,
      });
    } else {
      this.client = new Redis({
        host: this.config.get<string>("REDIS_HOST") || "localhost",
        port: this.config.get<number>("REDIS_PORT") || 6379,
        maxRetriesPerRequest: 3,
        retryStrategy,
        keepAlive: 10000,
        enableOfflineQueue: true,
      });
    }

    this.client.on("connect", () => {
      this.logger.log("Redis connected successfully");
    });

    this.client.on("error", (err: Error) => {
      // Only log unique error messages to avoid log spam during reconnection
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    // Ping every 30 seconds to keep Upstash connection alive
    this.pingInterval = setInterval(async () => {
      try {
        await this.client.ping();
      } catch {
        // Silent  retryStrategy will handle reconnection
      }
    }, 30_000);
  }

  async onModuleDestroy() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    await this.client.quit();
  }

  // ─────────────────────────────────────────
  // SLOT LOCKING  core feature
  // Locks a time slot for 10 minutes when
  // a customer selects it during booking
  // ─────────────────────────────────────────

  // Lock a slot  returns true if lock acquired, false if already locked
  async lockSlot(slotKey: string, userId: string): Promise<boolean> {
    // NX = only set if key does NOT exist (prevents overwriting existing lock)
    // EX = expire after 600 seconds (10 minutes)
    const result = await this.client.set(slotKey, userId, "EX", 600, "NX");
    return result === "OK";
  }

  // Check who holds the lock on a slot
  async getSlotLock(slotKey: string): Promise<string | null> {
    return this.client.get(slotKey);
  }

  // Release a slot lock (when booking is cancelled or completed)
  async releaseSlot(slotKey: string): Promise<void> {
    await this.client.del(slotKey);
  }

  // ─────────────────────────────────────────
  // DATE-LEVEL MUTEX  serializes the check-then-insert
  // critical section in BookingsService.create() so two
  // overlapping-but-different time ranges on the same date
  // can't both pass the overlap check before either commits.
  // Short-lived (10s)  only held for the duration of one create() call.
  // ─────────────────────────────────────────

  async acquireDateLock(date: string): Promise<string | null> {
    const token = crypto.randomUUID();
    const result = await this.client.set(
      `booking-lock:${date}`,
      token,
      "EX",
      10,
      "NX",
    );
    return result === "OK" ? token : null;
  }

  async releaseDateLock(date: string, token: string): Promise<void> {
    // Only release if we still hold it  avoids deleting a newer holder's
    // lock if ours already expired.
    const script = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
    await this.client.eval(script, 1, `booking-lock:${date}`, token);
  }

  // ─────────────────────────────────────────
  // GENERAL PURPOSE
  // ─────────────────────────────────────────

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
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

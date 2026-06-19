import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect to database when the app starts
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect cleanly when the app shuts down
    await this.$disconnect();
  }
}

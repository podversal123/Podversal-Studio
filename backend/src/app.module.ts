import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AgentsModule } from './agents/agents.module';
import { CustomersModule } from './customers/customers.module';
import { EmployeesModule } from './employees/employees.module';
import { CalendarModule } from './calendar/calendar.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlogsModule } from './blogs/blogs.module';
import { StudioVideosModule } from './studio-videos/studio-videos.module';
import { GalleryModule } from './gallery/gallery.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SseModule } from './sse/sse.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  controllers: [HealthController],
  imports: [
    // Load .env file globally across all modules
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting  max 100 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Core infrastructure
    PrismaModule,
    RedisModule,
    SseModule,
    ScheduleModule.forRoot(),
    SchedulerModule,

    // Feature modules
    AuthModule,
    UsersModule,
    BookingsModule,
    ServicesModule,
    PaymentsModule,
    InvoicesModule,
    AgentsModule,
    CustomersModule,
    EmployeesModule,
    CalendarModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    BlogsModule,
    StudioVideosModule,
    GalleryModule,
  ],
})
export class AppModule {}

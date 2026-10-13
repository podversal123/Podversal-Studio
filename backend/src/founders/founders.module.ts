import { Module } from "@nestjs/common";
import { FoundersController } from "./founders.controller";
import { FoundersAdminController } from "./founders-admin.controller";
import { FoundersService } from "./founders.service";
import { FoundersMailService } from "./founders-mail.service";
import { FoundersRemindersService } from "./founders-reminders.service";

// PrismaService and RedisService come from their @Global modules.
@Module({
  controllers: [FoundersController, FoundersAdminController],
  providers: [FoundersService, FoundersMailService, FoundersRemindersService],
})
export class FoundersModule {}

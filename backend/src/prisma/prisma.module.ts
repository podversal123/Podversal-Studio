import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global makes PrismaService available in ALL modules
// without needing to import PrismaModule everywhere
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

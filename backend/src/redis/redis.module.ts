import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

// @Global — RedisService available in all modules
// without importing RedisModule everywhere
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

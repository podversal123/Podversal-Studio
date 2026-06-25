import { Global, Module }   from '@nestjs/common';
import { JwtModule }        from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SseService }       from './sse.service';
import { SseController }    from './sse.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [SseController],
  providers:   [SseService],
  exports:     [SseService],
})
export class SseModule {}

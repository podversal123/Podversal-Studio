import { Controller, Get, MessageEvent, Query, Sse, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService }    from '@nestjs/jwt';
import { Observable, map } from 'rxjs';
import { SseService }    from './sse.service';

@Controller('events')
export class SseController {
  constructor(
    private readonly sse:    SseService,
    private readonly jwt:    JwtService,
    private readonly config: ConfigService,
  ) {}

  @Sse()
  stream(@Query('token') token: string): Observable<MessageEvent> {
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      this.jwt.verify(token, { secret: this.config.get<string>('JWT_SECRET') });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return this.sse.events$.pipe(
      map((event) => ({ data: JSON.stringify(event) } as MessageEvent)),
    );
  }
}

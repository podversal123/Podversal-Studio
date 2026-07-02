import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const cacheKey = `user:${payload.sub}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const user = JSON.parse(cached);
        if (!user.isActive)
          throw new UnauthorizedException("Account deactivated");
        return user;
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      // Redis down  fall through to DB
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        name: true,
        phone: true,
        avatarUrl: true,
      },
    });

    if (!user || !user.isActive)
      throw new UnauthorizedException("Account not found or deactivated");

    // Cache for 5 minutes  reduces DB hits on every request
    this.redis.set(cacheKey, JSON.stringify(user), 300).catch(() => {});

    return user;
  }
}

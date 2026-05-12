import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service.js";

export interface JwtPayload {
  sub: string;
  email?: string;
  user_metadata?: { first_name?: string; last_name?: string };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SUPABASE_JWT_SECRET ?? "",
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token: missing sub");
    }

    const user = await this.prisma.user.findUnique({
      where: { clerkId: payload.sub },
    });

    return { supabaseId: payload.sub, userId: user?.id ?? null, email: payload.email };
  }
}

import { Controller, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("users/me")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }
    return this.usersService.getMe(userId);
  }

  @Get("matches")
  @UseGuards(JwtAuthGuard)
  myMatches(@Req() req: any) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }
    return this.usersService.getMyMatches(userId);
  }

  @Get("rating")
  @UseGuards(JwtAuthGuard)
  rating(@Req() req: any) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }
    return this.usersService.getRating(userId);
  }

  @Get("elo-history")
  @UseGuards(JwtAuthGuard)
  history(@Req() req: any) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }
    return this.usersService.getEloHistory(userId);
  }
}

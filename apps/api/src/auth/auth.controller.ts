import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sync")
  @UseGuards(JwtAuthGuard)
  sync(@Req() req: any) {
    return this.authService.syncUser(req.user);
  }
}

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { MatchesService } from "./matches.service.js";
import { JoinMatchDto } from "./join-match.dto.js";
import { CompleteMatchDto } from "./complete-match.dto.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import {
  AlreadyJoinedError,
  MatchAlreadyCompletedError,
  MatchClosedError,
  MatchFullError,
  MatchNotReadyError,
  TeamNotAllowedError,
  TeamRequiredError,
  UnassignedParticipantsError,
  UnbalancedTeamsError,
} from "@footballtomic/db";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  list() {
    return this.matchesService.list();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const match = await this.matchesService.findOne(id);
    if (!match) throw new NotFoundException();
    return match;
  }

  @Post(":id/join")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async join(
    @Param("id") matchId: string,
    @Body() dto: JoinMatchDto,
    @Req() req: any,
  ) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }
    try {
      return await this.matchesService.join(matchId, userId, dto);
    } catch (err) {
      if (err instanceof TeamRequiredError) throw new BadRequestException(err.message);
      if (err instanceof TeamNotAllowedError) throw new BadRequestException(err.message);
      if (err instanceof AlreadyJoinedError) throw new ConflictException(err.message);
      if (err instanceof MatchFullError) throw new ConflictException(err.message);
      if (err instanceof MatchClosedError) throw new ForbiddenException(err.message);
      throw err;
    }
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async complete(
    @Param("id") matchId: string,
    @Body() dto: CompleteMatchDto,
    @Req() req: any,
  ) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }
    try {
      return await this.matchesService.complete(matchId, dto);
    } catch (err) {
      if (err instanceof MatchAlreadyCompletedError) throw new ConflictException(err.message);
      if (err instanceof MatchNotReadyError) throw new ForbiddenException(err.message);
      if (err instanceof UnassignedParticipantsError) throw new BadRequestException(err.message);
      if (err instanceof UnbalancedTeamsError) throw new BadRequestException(err.message);
      throw err;
    }
  }
}

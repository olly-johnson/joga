import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  ConflictException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { BookingsService } from "./bookings.service.js";
import { CreateBookingDto } from "./create-booking.dto.js";
import { BookingConflictError, BookingValidationError } from "@footballtomic/db";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateBookingDto, @Req() req: any) {
    const userId: string | null = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(
        "User not provisioned. Call POST /auth/sync first.",
      );
    }

    try {
      return await this.bookingsService.create(dto, userId);
    } catch (err) {
      if (err instanceof BookingConflictError) {
        throw new ConflictException(err.message);
      }
      if (err instanceof BookingValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}

import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { VenuesModule } from "./venues/venues.module.js";
import { BookingsModule } from "./bookings/bookings.module.js";

@Module({
  imports: [PrismaModule, AuthModule, VenuesModule, BookingsModule],
})
export class AppModule {}

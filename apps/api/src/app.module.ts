import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { VenuesModule } from "./venues/venues.module.js";
import { BookingsModule } from "./bookings/bookings.module.js";
import { MatchesModule } from "./matches/matches.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VenuesModule,
    BookingsModule,
    MatchesModule,
    UsersModule,
  ],
})
export class AppModule {}

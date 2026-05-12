import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

const DEFAULT_RATING = 1000;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async getRating(userId: string): Promise<{ rating: number }> {
    const latest = await this.prisma.eloRating.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { ratingAfter: true },
    });
    return { rating: latest?.ratingAfter ?? DEFAULT_RATING };
  }

  async getEloHistory(userId: string) {
    return this.prisma.eloRating.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            pitch: { include: { venue: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}

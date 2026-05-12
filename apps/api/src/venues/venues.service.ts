import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venue.findMany({
      include: { pitches: true },
      orderBy: { name: "asc" },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

interface AuthUser {
  supabaseId: string;
  userId: string | null;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(authUser: AuthUser) {
    const existing = await this.prisma.user.findUnique({
      where: { clerkId: authUser.supabaseId },
    });

    if (existing) return existing;

    return this.prisma.user.create({
      data: {
        clerkId: authUser.supabaseId,
        email: authUser.email ?? `${authUser.supabaseId}@placeholder.local`,
        firstName: "Player",
        lastName: "",
      },
    });
  }
}

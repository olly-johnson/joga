import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const databaseUrl =
  process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL_TEST or DATABASE_URL must be set to instantiate the Prisma client"
  );
}

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

export { PrismaClient } from "@prisma/client";
export type { User, UserRole, Role } from "@prisma/client";

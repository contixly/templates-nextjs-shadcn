import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";
import { isDevelopment, isProduction } from "better-auth";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: isDevelopment()
      ? [
          // "query",
          "error",
          "warn",
        ]
      : ["error"],
  });

if (!isProduction) globalForPrisma.prisma = prisma;

export default prisma;

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __academyPrisma: PrismaClient | undefined;
}

const createPrisma = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

export const prisma: PrismaClient =
  globalThis.__academyPrisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.__academyPrisma = prisma;
}

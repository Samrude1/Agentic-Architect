import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Use absolute path to avoid working directory issues in Next.js server context
  const dbPath = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;
  const adapter = new PrismaLibSql({
    url: dbPath,
  });
  prisma = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

export { prisma };

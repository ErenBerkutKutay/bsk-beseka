import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/** Şema değişince artır — dev ortamında eski client cache'ini temizler. */
const PRISMA_CLIENT_SCHEMA_VERSION = 6;

type CachedPrisma = PrismaClient & { __schemaVersion?: number };

const globalForPrisma = globalThis as unknown as {
  prisma: CachedPrisma | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter }) as CachedPrisma;
  client.__schemaVersion = PRISMA_CLIENT_SCHEMA_VERSION;
  return client;
}

function isStalePrismaClient(client: CachedPrisma) {
  return (
    !("homeIntro" in client) ||
    !("contactTeamMember" in client) ||
    client.__schemaVersion !== PRISMA_CLIENT_SCHEMA_VERSION
  );
}

function getPrismaClient() {
  if (globalForPrisma.prisma && isStalePrismaClient(globalForPrisma.prisma)) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = getPrismaClient();
}

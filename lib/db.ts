import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Ensure websocket constructor is bound for Neon serverless pool compatibility
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

try {
  const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/pixelverse';
  const adapter = new PrismaNeon({ connectionString });
  
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} catch (e) {
  console.error("⚠️ Failed to initialize Prisma with Neon Postgres adapter. Database fallback will be active.", e);
  prismaInstance = null as any;
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

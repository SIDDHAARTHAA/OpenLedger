import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(__dirname, '.env'), override: false });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to the project root .env or backend/shared/db/.env before starting the API.'
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export default db;

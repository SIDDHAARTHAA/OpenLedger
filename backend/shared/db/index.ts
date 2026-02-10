import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import type { PrismaClient as PrismaClientType } from './prisma-client.js';
import { PrismaClient } from './prisma-client.js';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '.env') });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
};


// console.log("Database URL:", process.env.DATABASE_URL);

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
import 'dotenv/config';
import { PrismaClient } from './prisma-client.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
const globalForPrisma = globalThis;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
export const db = globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ['error', 'warn'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db;
}
export default db;
//# sourceMappingURL=index.js.map
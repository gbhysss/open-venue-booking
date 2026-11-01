import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
const globalForDb = globalThis as unknown as { openVenuePool?: Pool };
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return globalForDb.openVenuePool ?? (globalForDb.openVenuePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 8 }));
}
export const pool = getPool();
export const db = drizzle({ client: pool, schema });

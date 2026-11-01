import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
const globalForDb = globalThis as unknown as { openVenuePool?: Pool };
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if(globalForDb.openVenuePool) return globalForDb.openVenuePool;
  const pool=new Pool({ connectionString: process.env.DATABASE_URL, max: 8, connectionTimeoutMillis: 3000 });
  // A database restart can close idle sockets; Pool emits an error for them.
  // Keep the web process alive so new connections can recover after restart.
  pool.on('error',()=>console.error('An idle database connection was interrupted'));
  globalForDb.openVenuePool=pool;
  return pool;
}
export const pool = getPool();
export const db = drizzle({ client: pool, schema });

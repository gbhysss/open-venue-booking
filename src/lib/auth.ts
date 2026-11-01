import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/client';
import * as schema from '@/db/schema';

export function makeAuth(allowSignUp = false) {
  if (process.env.NODE_ENV === 'production' && (!process.env.BETTER_AUTH_SECRET || (process.env.BETTER_AUTH_SECRET.length < 32 || process.env.BETTER_AUTH_SECRET.startsWith('replace-')))) {
    throw new Error('Configure BETTER_AUTH_SECRET with at least 32 random characters');
  }
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: { enabled: true, disableSignUp: !allowSignUp, minPasswordLength: 12 },
    trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
  });
}
export const auth = makeAuth(false);

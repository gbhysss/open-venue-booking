import 'dotenv/config';
import { makeAuth } from '../src/lib/auth';
import { db, pool } from '../src/db/client';
import { admins } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'OpenVenue Administrator';
  if(!email || !password || password.length < 12) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) as environment variables');
  const auth = makeAuth(true); // CLI-only, never exposed by the website.
  const signup = await auth.api.signUpEmail({ body: { email, password, name } });
  if(!signup?.user?.id) throw new Error('Account creation failed');
  await db.insert(admins).values({ userId: signup.user.id, role:'admin' });
  console.log(`Administrator created: ${email}. Remove ADMIN_PASSWORD from shell history/config.`);
}
main().catch(e=>{ console.error(e instanceof Error ? e.message : e); process.exitCode=1; }).finally(()=>pool.end());

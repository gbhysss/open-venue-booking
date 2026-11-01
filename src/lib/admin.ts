import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from './auth';
import { db } from '@/db/client';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function currentAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [record] = await db.select().from(admins).where(eq(admins.userId, session.user.id)).limit(1);
  return record ? { user: session.user, role: record.role } : null;
}
export function unauthorized() { return NextResponse.json({ error:'Unauthorized' }, { status: 401 }); }

import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { venues } from '@/db/schema';
export const dynamic='force-dynamic';
export async function GET() {
  const data = await db.select({id:venues.id,name:venues.name,description:venues.description,location:venues.location,capacity:venues.capacity})
    .from(venues).where(eq(venues.enabled,true)).orderBy(asc(venues.name));
  return NextResponse.json({data},{headers:{'Cache-Control':'no-store'}});
}

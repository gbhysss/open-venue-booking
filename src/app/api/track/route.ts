import { NextRequest,NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/db/client';
import { reservations,venues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readLimitedJson } from '@/lib/request-security';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest) {
  const body=await readLimitedJson(request,1024);
  if(!body.ok) return NextResponse.json({error:body.error},{status:body.status});
  const token=(body.data && typeof body.data==='object' && 'token' in body.data && typeof body.data.token==='string') ? body.data.token : '';
  if(!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return NextResponse.json({error:'Not found'},{status:404});
  const hash=createHash('sha256').update(token).digest('hex');
  const [row]=await db.select({bookingDate:reservations.bookingDate,startsAt:reservations.startsAt,endsAt:reservations.endsAt,
    status:reservations.status,decisionNote:reservations.decisionNote,venueName:venues.name})
    .from(reservations).innerJoin(venues,eq(reservations.venueId,venues.id))
    .where(eq(reservations.trackingTokenHash,hash)).limit(1);
  if(!row) return NextResponse.json({error:'Not found'},{status:404});
  return NextResponse.json({data:row},{headers:{'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer'}});
}

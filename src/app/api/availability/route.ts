import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/db/client';
import { reservations } from '@/db/schema';
import { and,eq } from 'drizzle-orm';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  const parsed=z.object({venueId:z.string().uuid(),date:z.iso.date()}).safeParse({venueId:request.nextUrl.searchParams.get('venueId'),date:request.nextUrl.searchParams.get('date')});
  if(!parsed.success) return NextResponse.json({error:'Invalid query'},{status:400});
  const {venueId,date}=parsed.data;
  const data=await db.select({startsAt:reservations.startsAt,endsAt:reservations.endsAt})
    .from(reservations).where(and(eq(reservations.venueId,venueId),eq(reservations.bookingDate,date),eq(reservations.status,'approved')));
  return NextResponse.json({data},{headers:{'Cache-Control':'no-store'}});
}

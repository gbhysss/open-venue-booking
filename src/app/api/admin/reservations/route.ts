import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { currentAdmin,unauthorized } from '@/lib/admin';
import { reservationListInput } from '@/lib/validation';
import { listReservations } from '@/lib/reservation-management';
export const dynamic='force-dynamic';
export async function GET(request: NextRequest) {
  if(!await currentAdmin()) return unauthorized();
  const parsed=reservationListInput.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if(!parsed.success) return NextResponse.json({error:'Invalid pagination or status'},{status:400});
  const result=await listReservations(db,parsed.data);
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store, private'}});
}

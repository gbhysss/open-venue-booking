import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { decideReservation, ReservationConflict } from '@/lib/reservation-management';
import { currentAdmin,unauthorized } from '@/lib/admin';
import { decisionInput } from '@/lib/validation';
import { z } from 'zod';
import { isTrustedWriteOrigin, readLimitedJson } from '@/lib/request-security';
export const runtime='nodejs';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const admin=await currentAdmin();
  if(!admin) return unauthorized();
  if(!isTrustedWriteOrigin(request, process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'))
    return NextResponse.json({error:'Invalid request origin'},{status:403});
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success) return NextResponse.json({error:'Invalid id'},{status:400});
  const body=await readLimitedJson(request);
  if(!body.ok) return NextResponse.json({error:body.error},{status:body.status});
  const parsed=decisionInput.safeParse(body.data);
  if(!parsed.success) return NextResponse.json({error:'Invalid decision'},{status:400});
  try {
    const changed=await decideReservation(db,id,admin.user.id,parsed.data);
    return NextResponse.json({data:changed});
  } catch(err:unknown) {
    if(err instanceof ReservationConflict) return NextResponse.json({error:err.message},{status:409});
    // 23P01 is PostgreSQL exclusion_violation (overlapping approved bookings).
    const e=err as {code?:string;cause?:{code?:string}};
    if(e.code==='23P01' || e.cause?.code==='23P01') return NextResponse.json({error:'This venue already has an approved booking at that time'},{status:409});
    console.error('Decision failed',err);
    return NextResponse.json({error:'Unable to process booking'},{status:500});
  }
}

import { NextRequest,NextResponse } from 'next/server';
import { randomBytes,createHash } from 'node:crypto';
import { db } from '@/db/client';
import { reservations,venues,reservationEvents } from '@/db/schema';
import { and,eq,gt,count,sql } from 'drizzle-orm';
import { reservationInput,isFutureSlot } from '@/lib/validation';
import { readLimitedJson } from '@/lib/request-security';
export const runtime='nodejs';
export async function POST(request:NextRequest) {
  const body=await readLimitedJson(request);
  if(!body.ok) return NextResponse.json({error:body.error},{status:body.status});
  const parsed=reservationInput.safeParse(body.data);
  if(!parsed.success) return NextResponse.json({error:'Please check the submitted fields',issues:parsed.error.flatten().fieldErrors},{status:400});
  const data=parsed.data;
  if(!isFutureSlot(data.bookingDate,data.startsAt)) return NextResponse.json({error:'Please choose a future time slot'},{status:400});
  const [venue]=await db.select().from(venues).where(and(eq(venues.id,data.venueId),eq(venues.enabled,true))).limit(1);
  if(!venue) return NextResponse.json({error:'Venue not found'},{status:404});
  if(data.attendees>venue.capacity) return NextResponse.json({error:'Attendee count exceeds venue capacity'},{status:400});
  const perMinute=Number(process.env.BOOKING_MAX_PER_MINUTE ?? '60');
  if(!Number.isSafeInteger(perMinute) || perMinute<1 || perMinute>10000)
    return NextResponse.json({error:'Invalid booking rate configuration'},{status:500});
  const token=randomBytes(32).toString('base64url');
  const trackingTokenHash=createHash('sha256').update(token).digest('hex');
  try {
   const result=await db.transaction(async tx=>{
    // Shared by all app instances. Serialize quota checks and inserts atomically.
    // Do not trust user-supplied forwarding headers as a client identity.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(628574210)`);
    const [globalRecent]=await tx.select({n:count()}).from(reservations)
      .where(gt(reservations.createdAt,sql`statement_timestamp() - interval '1 minute'`));
    if(Number(globalRecent.n)>=perMinute) throw new SubmissionRateLimit(60);
    const [recent]=await tx.select({n:count()}).from(reservations).where(and(
      eq(reservations.applicantEmail,data.applicantEmail.toLowerCase()),
      gt(reservations.createdAt,sql`statement_timestamp() - interval '24 hours'`)
    ));
    if(Number(recent.n)>=5) throw new SubmissionRateLimit(86400);
    const [created]=await tx.insert(reservations).values({
      venueId:data.venueId,bookingDate:data.bookingDate,startsAt:data.startsAt,endsAt:data.endsAt,
      applicantName:data.applicantName,applicantEmail:data.applicantEmail.toLowerCase(),
      purpose:data.purpose,attendees:data.attendees,trackingTokenHash,
    }).returning({id:reservations.id});
    await tx.insert(reservationEvents).values({reservationId:created.id,action:'created'});
    return created;
   });
   return NextResponse.json({data:{id:result.id,token,status:'pending'}},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(err) {
    if(err instanceof SubmissionRateLimit) return NextResponse.json({error:'Too many requests; please try later'},
      {status:429,headers:{'Retry-After':String(err.retryAfter),'Cache-Control':'no-store'}});
    throw err;
  }
}
class SubmissionRateLimit extends Error {
  constructor(readonly retryAfter:number){super('Submission rate limit reached')}
}

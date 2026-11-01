import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/db/client';
import { venues } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { currentAdmin,unauthorized } from '@/lib/admin';
import { venueInput } from '@/lib/validation';
import { isTrustedWriteOrigin,readLimitedJson } from '@/lib/request-security';
export const dynamic='force-dynamic';
export async function GET() {
  if(!await currentAdmin()) return unauthorized();
  const data=await db.select().from(venues).orderBy(desc(venues.createdAt));
  return NextResponse.json({data},{headers:{'Cache-Control':'no-store, private'}});
}
export async function POST(request:NextRequest) {
  if(!await currentAdmin()) return unauthorized();
  if(!isTrustedWriteOrigin(request, process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'))
    return NextResponse.json({error:'Invalid request origin'},{status:403});
  const body=await readLimitedJson(request);
  if(!body.ok) return NextResponse.json({error:body.error},{status:body.status});
  const parsed=venueInput.safeParse(body.data);
  if(!parsed.success) return NextResponse.json({error:'Invalid venue details',issues:parsed.error.flatten().fieldErrors},{status:400});
  const [created]=await db.insert(venues).values(parsed.data).returning();
  return NextResponse.json({data:created},{status:201});
}

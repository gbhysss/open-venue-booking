import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/db/client';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { currentAdmin,unauthorized } from '@/lib/admin';
import { venuePatchInput } from '@/lib/validation';
import { z } from 'zod';
import { isTrustedWriteOrigin,readLimitedJson } from '@/lib/request-security';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!await currentAdmin()) return unauthorized();
  if(!isTrustedWriteOrigin(req, process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'))
    return NextResponse.json({error:'Invalid request origin'},{status:403});
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success) return NextResponse.json({error:'Invalid id'},{status:400});
  const body=await readLimitedJson(req);
  if(!body.ok) return NextResponse.json({error:body.error},{status:body.status});
  const parsed=venuePatchInput.safeParse(body.data);
  if(!parsed.success || Object.keys(parsed.data).length===0) return NextResponse.json({error:'Invalid venue details'},{status:400});
  const [updated]=await db.update(venues).set(parsed.data).where(eq(venues.id,id)).returning();
  if(!updated) return NextResponse.json({error:'Not found'},{status:404});
  return NextResponse.json({data:updated});
}

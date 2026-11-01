import { NextResponse } from 'next/server';
import { pool } from '@/db/client';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET() {
  try {
    // Verify both database access and the presence of the migrated application schema.
    const query={text:'SELECT 1 FROM venues LIMIT 1',query_timeout:3000};
    await pool.query(query);
    return NextResponse.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

// Optional real-PostgreSQL test. Only run with an EXPLICIT disposable *_test database.
const testUrl = process.env.TEST_DATABASE_URL;
test('PostgreSQL rejects two approved overlapping slots', { skip: !testUrl }, async () => {
  if (!testUrl) throw new Error('Missing test database');
  if (!new URL(testUrl).pathname.endsWith('_test')) {
    throw new Error('Refusing to run destructive test outside a *_test database');
  }
  const pool = new Pool({ connectionString: testUrl });
  try {
    await pool.query(readFileSync(resolve('src/db/migrations/0001_initial.sql'),'utf8'));
    const venue=await pool.query<{id:string}>("INSERT INTO venues (name,capacity) VALUES ('Integration Test Space',15) RETURNING id");
    const id=venue.rows[0].id;
    const fields='venue_id,booking_date,starts_at,ends_at,applicant_name,applicant_email,purpose,attendees,status,tracking_token_hash';
    const insert=`INSERT INTO reservations (${fields}) VALUES ($1,'2035-06-12',$2,$3,'Test Person','test@example.org','Test event',3,'approved',$4) RETURNING id`;
    const first=await pool.query(insert,[id,'09:00','10:00','integration-a-'+id]);
    await assert.rejects(pool.query(insert,[id,'09:30','10:30','integration-b-'+id]),(err:unknown)=> (err as {code?:string}).code==='23P01');
    // Adjacent time slots share a boundary but do not overlap.
    const second=await pool.query(insert,[id,'10:00','10:30','integration-c-'+id]);
    assert.equal(second.rowCount,1);
    await pool.query('DELETE FROM reservations WHERE id = ANY($1::uuid[])',[[first.rows[0].id,second.rows[0].id]]);
    await pool.query('DELETE FROM venues WHERE id=$1',[id]);
  } finally { await pool.end(); }
});

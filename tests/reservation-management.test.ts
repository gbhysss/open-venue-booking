import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import { decideReservation, listReservations, ReservationConflict } from '../src/lib/reservation-management';

const testUrl=process.env.TEST_DATABASE_URL;
test('reservation management database regressions',{skip:!testUrl},async t=>{
  assert.ok(testUrl && new URL(testUrl).pathname.endsWith('_test'),'Use a disposable *_test database');
  const pool=new Pool({connectionString:testUrl,max:6});
  const database=drizzle({client:pool,schema});
  const adminId=randomUUID();let venueId='';
  try {
    const directory=resolve('src/db/migrations');
    for(const file of readdirSync(directory).filter(x=>x.endsWith('.sql')).sort()) {
      await pool.query(readFileSync(resolve(directory,file),'utf8'));
    }
    await pool.query('INSERT INTO "user"(id,name,email) VALUES($1,$2,$3)',[adminId,'Test Admin',adminId+'@example.org']);
    venueId=(await pool.query("INSERT INTO venues(name,capacity) VALUES('Regression Room',20) RETURNING id")).rows[0].id;
    async function booking(date='2035-06-12',start='09:00',end='10:00',attendees=3){
      return (await pool.query(`INSERT INTO reservations(venue_id,booking_date,starts_at,ends_at,
        applicant_name,applicant_email,purpose,attendees,tracking_token_hash,created_at)
        VALUES($1,$2,$3,$4,'Fictional Applicant','fixture@example.org','Regression fixture',$5,$6,'2020-01-01') RETURNING id`,
        [venueId,date,start,end,attendees,randomUUID()])).rows[0].id as string;
    }
    await t.test('older pending requests are found beyond 250 newer processed records',async()=>{
      const old=await booking();
      await pool.query(`INSERT INTO reservations(venue_id,booking_date,starts_at,ends_at,applicant_name,
        applicant_email,purpose,attendees,tracking_token_hash,status)
        SELECT $1,'2035-01-01','09:00','10:00','Fixture','fixture@example.org','Processed fixture',1,
        $2||g,'rejected' FROM generate_series(1,251) g`,[venueId,randomUUID()]);
      const result=await listReservations(database,{status:'pending',page:1,pageSize:25});
      assert.ok(result.data.some(x=>x.id===old));
      assert.equal(result.counts.pending,1);assert.equal(result.counts.rejected,251);
      const all=await listReservations(database,{status:'all',page:1,pageSize:100});
      const last=await listReservations(database,{status:'all',page:999,pageSize:100});
      assert.equal(all.pagination.pageCount,3);assert.equal(last.pagination.page,3);
      assert.equal(last.data.length,52);assert.equal(all.counts.all,252);
    });
    await t.test('expired approval is refused without changing state or audit history',async()=>{
      const id=await booking('2020-01-01');
      await assert.rejects(decideReservation(database,id,adminId,{status:'approved',decisionNote:''}),ReservationConflict);
      assert.equal((await pool.query('SELECT status FROM reservations WHERE id=$1',[id])).rows[0].status,'pending');
      assert.equal(Number((await pool.query('SELECT count(*) FROM reservation_events WHERE reservation_id=$1',[id])).rows[0].count),0);
      await decideReservation(database,id,adminId,{status:'rejected',decisionNote:'Expired'});
    });
    await t.test('paused venues and reduced capacity are rechecked during approval',async()=>{
      const id=await booking('2035-07-01','09:00','10:00',10);
      await pool.query('UPDATE venues SET enabled=false WHERE id=$1',[venueId]);
      await assert.rejects(decideReservation(database,id,adminId,{status:'approved',decisionNote:''}),/paused/);
      await pool.query('UPDATE venues SET enabled=true,capacity=5 WHERE id=$1',[venueId]);
      await assert.rejects(decideReservation(database,id,adminId,{status:'approved',decisionNote:''}),/capacity/);
      await pool.query('UPDATE venues SET capacity=20 WHERE id=$1',[venueId]);
    });
    await t.test('simultaneous overlapping approvals commit exactly one decision',async()=>{
      const a=await booking('2035-08-01'),b=await booking('2035-08-01','09:30','10:30');
      const results=await Promise.allSettled([a,b].map(id=>decideReservation(database,id,adminId,{status:'approved',decisionNote:''})));
      assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
      assert.equal(Number((await pool.query('SELECT count(*) FROM reservation_events WHERE reservation_id=ANY($1::uuid[])',[[a,b]])).rows[0].count),1);
    });
    await t.test('simultaneous decisions for one booking produce only one audit event',async()=>{
      const id=await booking('2035-09-01');
      const results=await Promise.allSettled(['approved','rejected'].map(status=>decideReservation(database,id,adminId,{status:status as 'approved'|'rejected',decisionNote:''})));
      assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
      assert.equal(Number((await pool.query('SELECT count(*) FROM reservation_events WHERE reservation_id=$1',[id])).rows[0].count),1);
    });
  } finally {
    if(venueId){await pool.query('DELETE FROM reservations WHERE venue_id=$1',[venueId]);await pool.query('DELETE FROM venues WHERE id=$1',[venueId]);}
    await pool.query('DELETE FROM "user" WHERE id=$1',[adminId]);
    await pool.end();
  }
});

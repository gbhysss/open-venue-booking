import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const appUrl=process.env.TEST_APP_URL;
test('HTTP regression workflow on a disposable local deployment',{skip:!appUrl},async t=>{
  const origin=new URL(appUrl!).origin;
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname),'Only test a local deployment');
  const testUrl=process.env.TEST_DATABASE_URL;
  assert.ok(testUrl && new URL(testUrl).pathname.endsWith('_test'),'Use a disposable *_test database');
  assert.ok(process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD,'Provide fictional test admin credentials');
  const pool=new Pool({connectionString:testUrl});
  let cookie='',venueId='';
  const prefix=randomUUID();
  async function request(path:string,method='GET',body?:unknown,admin=false,requestOrigin=origin){
    const headers:Record<string,string>={};
    if(body!==undefined)headers['Content-Type']='application/json';
    if(method!=='GET')headers.Origin=requestOrigin;
    if(admin)headers.Cookie=cookie;
    const r=await fetch(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    const j=await r.json().catch(()=>null);
    return {r,j,status:r.status};
  }
  const payload=()=>({venueId,bookingDate:'2035-06-10',startsAt:'09:00',endsAt:'10:00',
    applicantName:'Fictional Applicant',applicantEmail:prefix+'@example.org',purpose:'API regression',attendees:3,website:''});
  try {
    await t.test('authorization, disabled signup and administrator login',async()=>{
      for(const path of ['/api/admin/venues','/api/admin/reservations'])assert.equal((await request(path)).status,401);
      assert.ok((await request('/api/auth/sign-up/email','POST',{email:prefix+'@example.org',password:'fictional-test-only-password',name:'Outsider'})).status>=400);
      const login=await request('/api/auth/sign-in/email','POST',{email:process.env.TEST_ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD});
      assert.equal(login.status,200);
      cookie=login.r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');assert.ok(cookie);
      assert.equal((await request('/api/admin/venues','POST',{name:'Blocked',capacity:20},true,'https://untrusted.example.org')).status,403);
    });
    await t.test('venue pause preserves fields and empty patches are rejected',async()=>{
      const created=await request('/api/admin/venues','POST',{name:'API Regression Room',description:'Original description',location:'Original location',capacity:20},true);
      assert.equal(created.status,201);venueId=created.j.data.id;
      const paused=await request('/api/admin/venues/'+venueId,'PATCH',{enabled:false},true);
      assert.equal(paused.status,200);assert.equal(paused.j.data.description,'Original description');assert.equal(paused.j.data.location,'Original location');
      assert.equal((await request('/api/admin/venues/'+venueId,'PATCH',{},true)).status,400);
      assert.equal((await request('/api/admin/venues/'+venueId,'PATCH',{unknown:true},true)).status,400);
      assert.equal((await request('/api/admin/venues/'+venueId,'PATCH',{enabled:true},true)).status,200);
    });
    await t.test('invalid and oversized booking bodies are rejected',async()=>{
      assert.equal((await request('/api/reservations','POST',{attendees:0})).status,400);
      assert.equal((await request('/api/reservations','POST',{payload:'x'.repeat(9000)})).status,413);
    });
    await t.test('concurrent overlapping approvals and private tracking',async()=>{
      const a=await request('/api/reservations','POST',payload());
      const b=await request('/api/reservations','POST',{...payload(),startsAt:'09:30',endsAt:'10:30'});
      assert.equal(a.status,201);assert.equal(b.status,201);
      const decisions=await Promise.all([a,b].map(x=>request(`/api/admin/reservations/${x.j.data.id}/decision`,'PATCH',{status:'approved'},true)));
      assert.deepEqual(decisions.map(x=>x.status).sort(),[200,409]);
      const winner=decisions[0].status===200?a:b;
      const track=await request('/api/track','POST',{token:winner.j.data.token});
      assert.equal(track.status,200);assert.equal(track.j.data.status,'approved');
      assert.equal('applicantEmail' in track.j.data,false);assert.equal('applicantName' in track.j.data,false);
    });
    await t.test('expired approvals are refused over HTTP',async()=>{
      const old=await pool.query(`INSERT INTO reservations(venue_id,booking_date,starts_at,ends_at,applicant_name,applicant_email,purpose,attendees,tracking_token_hash,created_at)
        VALUES($1,'2020-01-01','09:00','10:00','Fictional','fixture@example.org','Expired fixture',1,$2,'2020-01-01') RETURNING id`,[venueId,randomUUID()]);
      const id=old.rows[0].id;
      assert.equal((await request(`/api/admin/reservations/${id}/decision`,'PATCH',{status:'approved'},true)).status,409);
      assert.equal((await request(`/api/admin/reservations/${id}/decision`,'PATCH',{status:'rejected'},true)).status,200);
    });
    await t.test('old pending requests and all pages remain accessible',async()=>{
      const old=await pool.query(`INSERT INTO reservations(venue_id,booking_date,starts_at,ends_at,applicant_name,applicant_email,purpose,attendees,tracking_token_hash,created_at)
        VALUES($1,'2035-10-01','09:00','10:00','Fictional','fixture@example.org','Old pending fixture',1,$2,'2020-01-01') RETURNING id`,[venueId,randomUUID()]);
      await pool.query(`INSERT INTO reservations(venue_id,booking_date,starts_at,ends_at,applicant_name,applicant_email,purpose,attendees,tracking_token_hash,status,created_at)
        SELECT $1,'2035-01-01','09:00','10:00','Fictional','fixture@example.org','Newer processed fixture',1,$2||g,'rejected','2021-01-01'
        FROM generate_series(1,251) g`,[venueId,randomUUID()]);
      const pending=await request('/api/admin/reservations?status=pending', 'GET',undefined,true);
      assert.equal(pending.status,200);assert.ok(pending.j.data.some((x:{id:string})=>x.id===old.rows[0].id));
      const first=await request('/api/admin/reservations?status=all&pageSize=100','GET',undefined,true);
      const ids=new Set<string>();
      for(let page=1;page<=first.j.pagination.pageCount;page++){
        const r=await request(`/api/admin/reservations?status=all&pageSize=100&page=${page}`,'GET',undefined,true);
        r.j.data.forEach((x:{id:string})=>ids.add(x.id));
      }
      assert.equal(ids.size,first.j.pagination.total);assert.ok(ids.has(old.rows[0].id));
      assert.equal((await request('/api/admin/reservations?pageSize=100000','GET',undefined,true)).status,400);
    });
    await t.test('parallel submissions cannot bypass the per-email quota',async()=>{
      const email=randomUUID()+'@example.org';
      const results=await Promise.all(Array.from({length:6},()=>request('/api/reservations','POST',{...payload(),applicantEmail:email})));
      assert.equal(results.filter(x=>x.status===201).length,5);assert.equal(results.filter(x=>x.status===429).length,1);
      assert.ok(results.find(x=>x.status===429)?.r.headers.get('retry-after'));
    });
    await t.test('changing email cannot bypass the shared per-minute ceiling',async()=>{
      // Only age this suite's own fixtures; never alter unrelated records.
      await pool.query("UPDATE reservations SET created_at=now()-interval '2 hours' WHERE venue_id=$1",[venueId]);
      const limit=Number(process.env.BOOKING_MAX_PER_MINUTE ?? '60');
      assert.ok(Number.isInteger(limit)&&limit>=1&&limit<=120,'Use a small test limit');
      const results=await Promise.all(Array.from({length:limit+1},()=>request('/api/reservations','POST',{...payload(),applicantEmail:randomUUID()+'@example.org'})));
      assert.equal(results.filter(x=>x.status===201).length,limit);assert.equal(results.filter(x=>x.status===429).length,1);
    });
  } finally {
    if(venueId){await pool.query('DELETE FROM reservations WHERE venue_id=$1',[venueId]);await pool.query('DELETE FROM venues WHERE id=$1',[venueId]);}
    await pool.end();
  }
});

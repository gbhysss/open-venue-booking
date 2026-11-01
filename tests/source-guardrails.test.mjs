import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();
const source = p => readFileSync(resolve(root,p),'utf8');
const walk = dir => readdirSync(resolve(root,dir),{withFileTypes:true}).flatMap(e=> e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
test('all administrator API routes require server-side authorization',()=>{
  for (const file of walk('src/app/api/admin').filter(f=>f.endsWith('/route.ts'))) {
    const s=source(file);
    assert.match(s,/currentAdmin\(/,file);
    assert.match(s,/unauthorized\(/,file);
    if(/export async function (PATCH|POST|PUT|DELETE)/.test(s)) {
      assert.match(s,/isTrustedWriteOrigin\(/,file);
      assert.match(s,/readLimitedJson\(/,file);
    }
  }
});
test('production account signup disabled and credential bootstrap is CLI-only',()=>{
  assert.match(source('src/lib/auth.ts'),/export const auth = makeAuth\(false\)/);
  assert.match(source('scripts/create-admin.ts'),/makeAuth\(true\)/);
});
test('migration contains a database exclusion rule for approved bookings',()=>{
  const sql=source('src/db/migrations/0001_initial.sql');
  assert.match(sql,/EXCLUDE USING gist/);
  assert.match(sql,/WHERE \(status = 'approved'\)/);
  assert.match(sql,/reservation_valid_time/);
});
test('release excludes live configuration and client data',()=>{
  assert.ok(!existsSync(resolve(root,'.env')),'local .env should never be present in a release checkout');
  const ignore=source('.gitignore');
  assert.match(ignore,/\.env/);
  assert.ok(existsSync(resolve(root,'.env.example')));
  assert.ok(!existsSync(resolve(root,'src/storage/database/shared/data.json')));
});

test('private tracking token stays out of HTTP URLs and is sent via POST body',()=>{
  assert.match(source('src/components/booking-form.tsx'),/\/track#token=/);
  assert.match(source('src/app/api/track/route.ts'),/export async function POST/);
  assert.doesNotMatch(source('src/app/api/track/route.ts'),/searchParams\.get\('token'\)/);
  assert.match(source('src/components/track-client.tsx'),/new URLSearchParams\(window\.location\.hash/);
});

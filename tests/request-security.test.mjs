import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrustedWriteOrigin, readLimitedJson } from '../src/lib/request-security.ts';
const local = 'https://booking.example.org';
const req = (origin, method = 'PATCH') => new Request('https://booking.example.org/api/admin/venues', {
  method,
  headers: origin === undefined ? {} : { Origin: origin },
});
test('accepts exact configured origin including explicit port', () => {
  assert.equal(isTrustedWriteOrigin(req(local), local), true);
  assert.equal(isTrustedWriteOrigin(req('http://localhost:3000'),'http://localhost:3000'), true);
});
test('rejects missing, null, cross origin, incorrect scheme or subdomain', () => {
  for (const origin of [undefined, 'null', 'https://evil.example.org', 'http://booking.example.org',
    'https://booking.example.org.evil.tld', 'https://booking.example.org:444', 'https://booking.example.org/evil']) {
    assert.equal(isTrustedWriteOrigin(req(origin), local), false, String(origin));
  }
});
test('accepts small JSON requests', async () => {
  const input = new Request('https://booking.example.org/api/admin/venues', {
    method: 'POST', headers: { 'Content-Type':'application/json; charset=utf-8' }, body:JSON.stringify({name:'Sample'})
  });
  assert.deepEqual(await readLimitedJson(input), { ok:true, data:{name:'Sample'} });
});
test('rejects incorrect media type', async () => {
  const input = new Request('https://booking.example.org/api/reservations', {method:'POST',body:'name=test'});
  assert.equal((await readLimitedJson(input)).status, 415);
});
test('rejects malformed JSON', async () => {
  const input = new Request('https://booking.example.org/api/reservations', {method:'POST',headers:{'Content-Type':'application/json'},body:'{'});
  assert.equal((await readLimitedJson(input)).status, 400);
});
test('rejects body larger than size limit, including streamed content', async () => {
  const oversized = new Request('https://booking.example.org/api/reservations', {method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({payload:'a'.repeat(9000)})});
  assert.equal((await readLimitedJson(oversized,1024)).status, 413);
});
test('rejects empty body', async () => {
  const empty = new Request('https://booking.example.org/api/reservations', {method:'POST',headers:{'Content-Type':'application/json'}});
  assert.equal((await readLimitedJson(empty)).status, 400);
});

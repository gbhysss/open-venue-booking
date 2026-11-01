import test from 'node:test';
import assert from 'node:assert/strict';
import { todayInZone, isFutureSlot } from '../src/lib/timezone.ts';
test('date calculation obeys configured venue time zone near midnight', () => {
  const now = new Date('2026-11-01T16:30:00Z');
  assert.equal(todayInZone('Asia/Shanghai',now),'2026-11-02');
  assert.equal(todayInZone('Asia/Tokyo',now),'2026-11-02');
  assert.equal(todayInZone('Europe/London',now),'2026-11-01');
});
test('same-day slots earlier than current venue time are rejected', () => {
  const now = new Date('2026-11-01T01:30:00Z'); // 09:30 in Shanghai
  assert.equal(isFutureSlot('2026-11-01','09:00',now,'Asia/Shanghai'),false);
  assert.equal(isFutureSlot('2026-11-01','10:00',now,'Asia/Shanghai'),true);
  assert.equal(isFutureSlot('2026-11-02','09:00',now,'Asia/Shanghai'),true);
});

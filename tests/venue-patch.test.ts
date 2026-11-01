import test from 'node:test';
import assert from 'node:assert/strict';
import { venuePatchInput, reservationListInput } from '../src/lib/validation';
import { isFutureSlot } from '../src/lib/timezone';

test('pause and enable preserve omitted venue fields',()=>{
  assert.deepEqual(venuePatchInput.parse({enabled:false}),{enabled:false});
  assert.deepEqual(venuePatchInput.parse({enabled:true}),{enabled:true});
});
test('capacity-only change does not activate venue or clear descriptions',()=>{
  assert.deepEqual(venuePatchInput.parse({capacity:12}),{capacity:12});
});
test('empty and unknown-only venue updates are rejected',()=>{
  for(const input of [{},{unknown:true},{enabled:undefined}]) {
    assert.equal(venuePatchInput.safeParse(input).success,false);
  }
});
test('explicit clearing of a description remains possible',()=>{
  assert.deepEqual(venuePatchInput.parse({description:''}),{description:''});
});
test('pagination rejects unbounded pages, invalid status and invalid sizes',()=>{
  for(const input of [{page:0},{page:'NaN'},{pageSize:101},{pageSize:0},{status:'deleted'}]) {
    assert.equal(reservationListInput.safeParse(input).success,false);
  }
});
test('database time values with seconds cannot approve a current-minute slot',()=>{
  const now=new Date('2026-11-01T01:30:20Z');
  assert.equal(isFutureSlot('2026-11-01','09:30:00',now,'Asia/Shanghai'),false);
  assert.equal(isFutureSlot('2026-11-01','09:31:00',now,'Asia/Shanghai'),true);
});

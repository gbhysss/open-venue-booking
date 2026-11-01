import 'dotenv/config';
import { db, pool } from '../src/db/client';
import { venues } from '../src/db/schema';
async function main() {
  if(process.env.ALLOW_DEMO_SEED !== 'true') throw new Error('Set ALLOW_DEMO_SEED=true to insert fictional demo venues');
  await db.insert(venues).values([
    { name:'Community Meeting Room', description:'A bright, flexible space for meetings and workshops.',location:'Demo Center · 2F',capacity:28 },
    { name:'Creative Studio', description:'A collaborative room for courses and small group activities.',location:'Demo Center · 3F',capacity:16 },
    { name:'Multipurpose Hall', description:'Suitable for talks, club events and presentations.',location:'Demo Center · Ground Floor',capacity:120 },
  ]);
  console.log('Added fictional example venues.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>pool.end());

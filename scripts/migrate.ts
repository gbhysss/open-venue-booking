import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
async function main() {
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const directory=path.join(process.cwd(),'src/db/migrations');
    for(const file of fs.readdirSync(directory).filter(name=>/^\d+_.*\.sql$/.test(name)).sort()) {
      await db.query(fs.readFileSync(path.join(directory,file),'utf8'));
      console.log(`Database migration complete: ${file}`);
    }
  } finally { await db.end(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

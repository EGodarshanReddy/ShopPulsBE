import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

dotenv.config();

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set in environment. Put your DB URL in .env');
    process.exit(2);
  }

  const migrationsDir = path.resolve(process.cwd(), 'server', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(3);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log('No .sql files to run in', migrationsDir);
    process.exit(0);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    for (const file of files) {
      const fp = path.join(migrationsDir, file);
      console.log('Running migration', fp);
      const sql = fs.readFileSync(fp, 'utf8');
      await client.query(sql);
    }
    console.log('Migrations applied successfully');
  } catch (err: any) {
    console.error('Migration failed:', err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

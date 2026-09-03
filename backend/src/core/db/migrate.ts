import fs from 'fs';
import path from 'path';
import pool from '../database/pool';

async function migrate() {
  const schemaFiles = ['mysql.sql', 'content_sections.sql'];

  try {
    for (const fileName of schemaFiles) {
      const schemaPath = path.join(__dirname, fileName);
      if (!fs.existsSync(schemaPath)) {
        console.warn(`[migrate] Schema file not found: ${fileName}, skipping.`);
        continue;
      }
      const sql = fs.readFileSync(schemaPath, 'utf-8');

      console.log(`[migrate] Applying schema from ${fileName}...`);
      const queries = sql
        .split(';')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      for (const q of queries) {
        await pool.query(q);
      }
      console.log(`[migrate] ${fileName} applied successfully.`);
    }
  } finally {
  }
  await pool.end();
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});

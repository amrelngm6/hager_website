import bcrypt from 'bcryptjs';
import pool, { query } from '../database/pool';

async function seed() {
  console.log('[seed] Seeding database...');

  const passwordHash = await bcrypt.hash('Medians', 12);
  await query(
    `INSERT INTO users (first_name, email, password_hash) VALUES (?,?,?) `,
    ['Admin', 'admin@localhost', passwordHash]
  );

  console.log('[seed] Done.');
  console.log('[seed] Admin login → email: admin@localhost  password: Medians');
  console.log('[seed] IMPORTANT: change the admin password after first login.');

  await pool.end();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

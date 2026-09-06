const fs = require('fs');
const path = require('path');
const { createPool } = require('./lib/db');

function stripSqlComments(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .trim();
}

async function migrate() {
  const dir = path.join(__dirname, '..', 'sql');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    throw new Error('No SQL files found in /sql');
  }

  const pool = await createPool();
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS=0');
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const cleaned = stripSqlComments(raw);
      if (!cleaned) {
        console.log(`Skipped empty ${file}`);
        continue;
      }

      const statements = cleaned
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log(`Applied ${file}`);
    }
    await pool.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('Schema migration completed successfully.');
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

const { createPool } = require('./lib/db');
const { fetchFixtures } = require('./apis/fixtures');
const { isMatchday } = require('./lib/matchday');
const { runSync } = require('./syncAll');

const ONE_MINUTE = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
let syncing = false;

async function getMeta(pool, key) {
  const [rows] = await pool.query(
    'SELECT meta_value, updated_at FROM sync_meta WHERE meta_key = ? LIMIT 1',
    [key]
  );
  return rows[0] || null;
}

async function shouldSync(pool, matchday) {
  if (matchday) return { run: true, reason: 'matchday-1min' };
  const last = await getMeta(pool, 'last_sync_at');
  if (!last) return { run: true, reason: 'initial-sync' };
  const lastMs = Date.parse(last.meta_value) || new Date(last.updated_at).getTime();
  const age = Date.now() - lastMs;
  if (age >= ONE_DAY) return { run: true, reason: 'daily-refresh' };
  return { run: false, reason: `next-daily-in-${Math.ceil((ONE_DAY - age) / 60000)}m` };
}

async function tick() {
  if (syncing) {
    console.log(`[scheduler ${new Date().toISOString()}] skip — previous sync still running`);
    return;
  }

  const stamp = new Date().toISOString();
  let pool;
  try {
    const fixtures = await fetchFixtures();
    const matchday = isMatchday(fixtures);
    pool = await createPool();
    const decision = await shouldSync(pool, matchday);
    await pool.end();
    pool = null;

    console.log(`[scheduler ${stamp}] matchday=${matchday} decision=${decision.reason}`);
    if (!decision.run) return;

    syncing = true;
    try {
      await runSync();
    } finally {
      syncing = false;
    }
  } catch (err) {
    syncing = false;
    console.error(`[scheduler ${stamp}] error:`, err.message);
    if (pool) {
      try {
        await pool.end();
      } catch (_) {
        /* ignore */
      }
    }
  }
}

async function main() {
  console.log('[scheduler] FPL Hub sync started');
  console.log('[scheduler] Matchday → every 1 minute | Non-matchday → once per day');
  await tick();
  setInterval(tick, ONE_MINUTE);
}

main().catch((err) => {
  console.error('[scheduler] fatal:', err);
  process.exit(1);
});

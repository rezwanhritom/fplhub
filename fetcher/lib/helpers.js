const FPL_BASE = 'https://fantasy.premierleague.com/api';

async function fetchJson(urlPath) {
  const url = `${FPL_BASE}${urlPath}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'FPLHubSync/1.0 (+local-data-sync)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`FPL API ${urlPath} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toMysqlDatetime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

const POSITION_MAP = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FOR' };
const STATUS_MAP = {
  a: 'Available',
  d: 'Doubtful',
  i: 'Injured',
  s: 'Suspended',
  u: 'Unavailable',
  n: 'Unavailable',
};

function mapPlayerStatus(code) {
  return STATUS_MAP[code] || 'Available';
}

function seasonLabelFromBootstrap(bootstrap) {
  const first = bootstrap.events?.[0]?.deadline_time;
  if (!first) return '';
  const y = new Date(first).getUTCFullYear();
  return `${y}/${String(y + 1).slice(-2)}`;
}

async function execBatch(conn, sqlPrefix, sqlSuffix, rows, batchSize = 50) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const placeholders = chunk.map((r) => `(${r.map(() => '?').join(',')})`).join(',');
    await conn.query(`${sqlPrefix} VALUES ${placeholders} ${sqlSuffix}`, chunk.flat());
  }
}

async function setMeta(conn, key, value) {
  await conn.query(
    `INSERT INTO sync_meta (meta_key, meta_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`,
    [key, String(value)]
  );
}

module.exports = {
  fetchJson,
  num,
  toMysqlDatetime,
  POSITION_MAP,
  mapPlayerStatus,
  seasonLabelFromBootstrap,
  execBatch,
  setMeta,
};

const { createPool } = require('./lib/db');
const { seasonLabelFromBootstrap, setMeta } = require('./lib/helpers');
const { isMatchday } = require('./lib/matchday');
const { fetchBootstrapStatic } = require('./apis/bootstrapStatic');
const { fetchFixtures } = require('./apis/fixtures');
const { syncTeams } = require('./jobs/syncTeams');
const { syncPlayers } = require('./jobs/syncPlayers');
const { syncGameweeks } = require('./jobs/syncGameweeks');
const { syncPhases } = require('./jobs/syncPhases');
const { syncFixtures } = require('./jobs/syncFixtures');
const { syncLive } = require('./jobs/syncLive');

async function runSync() {
  const startedAt = Date.now();
  const pool = await createPool();
  const conn = await pool.getConnection();

  try {
    console.log('[sync] API: bootstrap-static + fixtures (+ live if current GW)');
    const [bootstrap, fixtures] = await Promise.all([
      fetchBootstrapStatic(),
      fetchFixtures(),
    ]);

    const seasonId = seasonLabelFromBootstrap(bootstrap);
    const teamsById = new Map(bootstrap.teams.map((t) => [t.id, t]));
    const names = new Map(bootstrap.elements.map((e) => [e.id, e.web_name]));
    const matchday = isMatchday(fixtures);
    const currentEvent = (bootstrap.events || []).find((e) => e.is_current);

    await conn.beginTransaction();

    const teamCount = await syncTeams(conn, bootstrap.teams, seasonId);
    const playerCount = await syncPlayers(conn, bootstrap.elements, teamsById, seasonId);
    const gwCount = await syncGameweeks(conn, bootstrap.events, names, seasonId);
    const phaseCount = await syncPhases(conn, bootstrap.phases, seasonId);
    const fixtureRows = await syncFixtures(conn, fixtures, teamsById, seasonId);

    let liveCount = 0;
    if (currentEvent && (matchday || !currentEvent.finished)) {
      liveCount = await syncLive(conn, currentEvent.id);
    }

    await setMeta(conn, 'last_sync_at', new Date().toISOString());
    await setMeta(conn, 'last_sync_mode', matchday ? 'matchday' : 'daily');
    await setMeta(conn, 'last_matchday', matchday ? '1' : '0');
    await setMeta(conn, 'season_id', seasonId);
    await setMeta(conn, 'player_count', String(playerCount));
    await setMeta(conn, 'fixture_count', String(fixtures.length));
    await setMeta(conn, 'live_count', String(liveCount));
    if (currentEvent) await setMeta(conn, 'current_event', String(currentEvent.id));

    await conn.commit();

    console.log(
      `[sync] OK in ${Date.now() - startedAt}ms | season=${seasonId} | teams=${teamCount} players=${playerCount} gws=${gwCount} phases=${phaseCount} fixtureRows=${fixtureRows} live=${liveCount} matchday=${matchday}`
    );
    return { matchday, seasonId, playerCount, fixtures: fixtures.length, liveCount };
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSync()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[sync] failed:', err.message);
      process.exit(1);
    });
}

module.exports = { runSync };

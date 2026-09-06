const { execBatch } = require('../lib/helpers');

async function syncPhases(conn, phases, seasonId) {
  const rows = (phases || []).map((p) => [
    p.id,
    p.name,
    seasonId,
    p.start_event,
    p.stop_event,
    p.highest_score ?? null,
    seasonId,
  ]);

  await execBatch(
    conn,
    `INSERT INTO fpl_hub_monthly_data (
      month_id, name, season_id, start_gw, stop_gw, highest_point, pyfy
    )`,
    `ON DUPLICATE KEY UPDATE
      name=VALUES(name), season_id=VALUES(season_id), start_gw=VALUES(start_gw),
      stop_gw=VALUES(stop_gw), highest_point=VALUES(highest_point), pyfy=VALUES(pyfy)`,
    rows
  );
  return rows.length;
}

module.exports = { syncPhases };

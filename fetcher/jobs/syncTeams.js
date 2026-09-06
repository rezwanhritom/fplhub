const { num, execBatch } = require('../lib/helpers');

async function syncTeams(conn, teams, seasonId) {
  const rows = teams.map((t) => [
    t.id,
    t.name,
    seasonId,
    (t.short_name || '').toLowerCase(),
    num(t.strength),
    num(t.strength_overall_home),
    num(t.strength_overall_away),
    num(t.strength_attack_home),
    num(t.strength_attack_away),
    num(t.strength_defence_home),
    num(t.strength_defence_away),
    seasonId,
  ]);

  await execBatch(
    conn,
    `INSERT INTO fpl_hub_team_data (
      team_id, team_name, season_id, short_form, strength,
      strength_home, strength_away, strength_home_att, strength_away_att,
      strength_home_def, strength_away_def, pyfy
    )`,
    `ON DUPLICATE KEY UPDATE
      team_name=VALUES(team_name), season_id=VALUES(season_id), short_form=VALUES(short_form),
      strength=VALUES(strength), strength_home=VALUES(strength_home), strength_away=VALUES(strength_away),
      strength_home_att=VALUES(strength_home_att), strength_away_att=VALUES(strength_away_att),
      strength_home_def=VALUES(strength_home_def), strength_away_def=VALUES(strength_away_def),
      pyfy=VALUES(pyfy)`,
    rows
  );
  return rows.length;
}

module.exports = { syncTeams };

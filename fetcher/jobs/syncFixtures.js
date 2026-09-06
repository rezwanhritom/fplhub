const { num, toMysqlDatetime, execBatch } = require('../lib/helpers');

function fixtureStatus(f) {
  if (f.finished) return 'Done';
  if (f.started) return 'Live';
  return 'Not Done';
}

function matchResult(teamScore, oppScore) {
  if (teamScore === null || oppScore === null) return null;
  if (teamScore > oppScore) return 'Win';
  if (teamScore < oppScore) return 'Loss';
  return 'Draw';
}

async function syncFixtures(conn, fixtures, teamsById, seasonId) {
  const rows = [];
  for (const f of fixtures) {
    const home = teamsById.get(f.team_h);
    const away = teamsById.get(f.team_a);
    if (!home || !away) continue;

    const status = fixtureStatus(f);
    const kickoff = toMysqlDatetime(f.kickoff_time);
    const finished = f.finished ? 1 : 0;
    const started = f.started ? 1 : 0;

    rows.push([
      f.id, home.name, f.event, away.name, f.team_h, f.team_a, `${f.id}-${f.team_h}`,
      'home', status, f.team_h_score, f.team_a_score, matchResult(f.team_h_score, f.team_a_score),
      num(f.team_h_difficulty), num(f.team_a_difficulty), num(f.team_h_difficulty),
      kickoff, finished, started, seasonId,
    ]);
    rows.push([
      f.id, away.name, f.event, home.name, f.team_a, f.team_h, `${f.id}-${f.team_a}`,
      'away', status, f.team_a_score, f.team_h_score, matchResult(f.team_a_score, f.team_h_score),
      num(f.team_a_difficulty), num(f.team_h_difficulty), num(f.team_a_difficulty),
      kickoff, finished, started, seasonId,
    ]);
  }

  await execBatch(
    conn,
    `INSERT INTO fpl_hub_fixture_data (
      fixture_id, team_name, gameweek, opp_team, team_id, opp_team_id, fdr_id,
      ground, status, team_score, opp_score, result, team_diff, opp_diff, fdr,
      kickoff_time, finished, started, pyfy
    )`,
    `ON DUPLICATE KEY UPDATE
      team_name=VALUES(team_name), gameweek=VALUES(gameweek), opp_team=VALUES(opp_team),
      opp_team_id=VALUES(opp_team_id), fdr_id=VALUES(fdr_id), ground=VALUES(ground),
      status=VALUES(status), team_score=VALUES(team_score), opp_score=VALUES(opp_score),
      result=VALUES(result), team_diff=VALUES(team_diff), opp_diff=VALUES(opp_diff),
      fdr=VALUES(fdr), kickoff_time=VALUES(kickoff_time), finished=VALUES(finished),
      started=VALUES(started), pyfy=VALUES(pyfy)`,
    rows
  );
  return rows.length;
}

module.exports = { syncFixtures };

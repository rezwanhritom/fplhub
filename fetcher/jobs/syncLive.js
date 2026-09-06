const { num, execBatch } = require('../lib/helpers');
const { fetchEventLive } = require('../apis/eventLive');

function normalizeStats(el) {
  if (Array.isArray(el.stats)) {
    const s = {};
    for (const item of el.stats) s[item.identifier] = item.value;
    return s;
  }
  if (el.stats && typeof el.stats === 'object') return el.stats;
  return {};
}

async function syncLive(conn, eventId) {
  if (!eventId) return 0;
  const live = await fetchEventLive(eventId);
  const rows = [];

  for (const el of live.elements || []) {
    const s = normalizeStats(el);
    rows.push([
      eventId,
      el.id,
      num(s.minutes),
      num(s.goals_scored),
      num(s.assists),
      num(s.clean_sheets),
      num(s.goals_conceded),
      num(s.own_goals),
      num(s.penalties_saved),
      num(s.penalties_missed),
      num(s.yellow_cards),
      num(s.red_cards),
      num(s.saves),
      num(s.bonus),
      num(s.bps),
      num(s.influence),
      num(s.creativity),
      num(s.threat),
      num(s.ict_index),
      num(s.total_points),
      s.in_dreamteam ? 1 : 0,
    ]);
  }

  await execBatch(
    conn,
    `INSERT INTO fpl_hub_player_live (
      event_id, player_id, minutes, goals, assists, clean_sheets, goals_conceded,
      own_goals, penalties_saved, penalties_missed, yellow_cards, red_cards, saves,
      bonus, bps, influence, creativity, threat, ict_index, total_points, in_dreamteam
    )`,
    `ON DUPLICATE KEY UPDATE
      minutes=VALUES(minutes), goals=VALUES(goals), assists=VALUES(assists),
      clean_sheets=VALUES(clean_sheets), goals_conceded=VALUES(goals_conceded),
      own_goals=VALUES(own_goals), penalties_saved=VALUES(penalties_saved),
      penalties_missed=VALUES(penalties_missed), yellow_cards=VALUES(yellow_cards),
      red_cards=VALUES(red_cards), saves=VALUES(saves), bonus=VALUES(bonus),
      bps=VALUES(bps), influence=VALUES(influence), creativity=VALUES(creativity),
      threat=VALUES(threat), ict_index=VALUES(ict_index), total_points=VALUES(total_points),
      in_dreamteam=VALUES(in_dreamteam)`,
    rows
  );
  return rows.length;
}

module.exports = { syncLive };

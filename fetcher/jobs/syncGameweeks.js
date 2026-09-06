const { num, toMysqlDatetime, execBatch } = require('../lib/helpers');

async function syncGameweeks(conn, events, names, seasonId) {
  const rows = events.map((e) => {
    const chips = { bboost: 0, freehit: 0, wildcard: 0, '3xc': 0 };
    for (const c of e.chip_plays || []) {
      if (Object.prototype.hasOwnProperty.call(chips, c.chip_name)) {
        chips[c.chip_name] = num(c.num_played);
      }
    }
    let status = 'Upcoming';
    if (e.finished) status = 'Finished';
    else if (e.is_current) status = 'Current';
    else if (e.is_next) status = 'Next';
    else if (e.is_previous) status = 'Previous';

    return [
      e.id,
      e.name,
      seasonId,
      toMysqlDatetime(e.deadline_time),
      status,
      e.average_entry_score,
      e.highest_score,
      e.is_previous ? 1 : 0,
      e.is_current ? 1 : 0,
      e.is_next ? 1 : 0,
      e.can_enter ? 1 : 0,
      e.can_manage ? 1 : 0,
      chips.bboost,
      chips.freehit,
      chips.wildcard,
      chips['3xc'],
      names.get(e.most_selected) || null,
      names.get(e.most_transferred_in) || null,
      names.get(e.top_element) || null,
      e.top_element_info ? e.top_element_info.points : null,
      names.get(e.most_captained) || null,
      names.get(e.most_vice_captained) || null,
      e.transfers_made,
      e.finished ? 1 : 0,
      seasonId,
    ];
  });

  await execBatch(
    conn,
    `INSERT INTO fpl_hub_gw_data (
      gw_id, gw, season_id, gw_deadline, status, average_score, highest_score,
      event_is_pre, event_is_cur, event_is_next, event_can_enter, event_can_manage,
      bboost_count, freehit_count, wildcard_count, xc3_count,
      most_selected, most_ti, highest_player, hp_score, most_c, most_vc,
      transfers_made, finished, pyfy
    )`,
    `ON DUPLICATE KEY UPDATE
      gw=VALUES(gw), season_id=VALUES(season_id), gw_deadline=VALUES(gw_deadline),
      status=VALUES(status), average_score=VALUES(average_score), highest_score=VALUES(highest_score),
      event_is_pre=VALUES(event_is_pre), event_is_cur=VALUES(event_is_cur),
      event_is_next=VALUES(event_is_next), event_can_enter=VALUES(event_can_enter),
      event_can_manage=VALUES(event_can_manage), bboost_count=VALUES(bboost_count),
      freehit_count=VALUES(freehit_count), wildcard_count=VALUES(wildcard_count),
      xc3_count=VALUES(xc3_count), most_selected=VALUES(most_selected), most_ti=VALUES(most_ti),
      highest_player=VALUES(highest_player), hp_score=VALUES(hp_score), most_c=VALUES(most_c),
      most_vc=VALUES(most_vc), transfers_made=VALUES(transfers_made), finished=VALUES(finished),
      pyfy=VALUES(pyfy)`,
    rows
  );
  return rows.length;
}

module.exports = { syncGameweeks };

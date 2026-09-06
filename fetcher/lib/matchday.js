/**
 * Matchday = any fixture kicking off today (local time),
 * or currently live (started, not finished, within ~3.5h of kickoff).
 */
function isMatchday(fixtures, now = new Date()) {
  const today = toDateKey(now);

  return (fixtures || []).some((f) => {
    if (!f.kickoff_time) return false;
    const kickoff = new Date(f.kickoff_time);
    if (Number.isNaN(kickoff.getTime())) return false;

    const kickoffToday = toDateKey(kickoff) === today;
    const started = Boolean(f.started) || kickoff.getTime() <= now.getTime();
    const finished = Boolean(f.finished);
    const ageMs = now.getTime() - kickoff.getTime();
    const withinMatchWindow = ageMs >= -30 * 60 * 1000 && ageMs <= 3.5 * 60 * 60 * 1000;
    const live = started && !finished && withinMatchWindow;

    return kickoffToday || live;
  });
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = { isMatchday, toDateKey };

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const go = (path) => {
    location.href = FPLHUB.page(path);
  };

  document.getElementById('brand-home')?.addEventListener('click', () => go('homepage.html'));
  document.getElementById('btn-login')?.addEventListener('click', () => go('login.html'));
  document.getElementById('btn-signup')?.addEventListener('click', () => go('signup.html'));
  document.getElementById('cta-start')?.addEventListener('click', () => go('signup.html'));

  loadMatchday();
  loadTable();
  setInterval(updateCountdowns, 1000);
});

let fixtureTimers = [];

async function loadMatchday() {
  const rail = document.getElementById('upcoming-matches');
  const title = document.getElementById('matchday-title');
  const sub = document.getElementById('matchday-sub');
  const heroGw = document.getElementById('hero-gw-label');
  const heroMeta = document.getElementById('hero-sync-meta');

  try {
    const res = await fetch(FPLHUB.url('fetch_matchweek.php'));
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load fixtures');

    const gwName = data.gameweek?.name || 'Current gameweek';
    if (title) title.textContent = gwName;
    if (heroGw) heroGw.textContent = gwName;
    if (heroMeta) {
      heroMeta.textContent = `${data.fixtures?.length || 0} fixtures loaded from hub DB`;
    }
    if (sub) {
      sub.textContent = data.gameweek?.status
        ? `Status: ${data.gameweek.status}`
        : 'Fixtures from your synced database.';
    }

    fixtureTimers = [];
    if (!data.fixtures?.length) {
      rail.innerHTML = '<div class="empty-state panel">No fixtures found for this gameweek yet.</div>';
      return;
    }

    rail.innerHTML = data.fixtures
      .map((f, idx) => {
        const kickoff = f.kickoff_time ? new Date(f.kickoff_time.replace(' ', 'T') + 'Z') : null;
        const score =
          f.status === 'Done' || f.status === 'Live'
            ? `${f.team_score ?? '-'} – ${f.opp_score ?? '-'}`
            : '';
        const statusClass =
          f.status === 'Live' ? 'live' : f.status === 'Done' ? 'done' : '';
        fixtureTimers[idx] = kickoff;
        return `
          <article class="fixture-card">
            <div class="teams">${escapeHtml(f.team_name)} vs ${escapeHtml(f.opp_team)}</div>
            <div class="meta">
              ${score ? `<strong>${score}</strong> · ` : ''}
              ${kickoff ? kickoff.toLocaleString() : 'Kickoff TBD'}
              ${f.fdr != null ? ` · FDR ${f.fdr}` : ''}
            </div>
            <div class="meta time-left" data-idx="${idx}">${kickoff ? timeLeft(kickoff) : '—'}</div>
            <span class="status ${statusClass}">${escapeHtml(f.status || 'Scheduled')}</span>
          </article>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    rail.innerHTML = `<div class="empty-state panel">Could not load matchday: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadTable() {
  const tbody = document.querySelector('#standings-table tbody');
  const detail = document.getElementById('standings-detail');
  try {
    const res = await fetch(FPLHUB.url('fetch_pl_table.php'));
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load table');

    if (!data.table?.length) {
      tbody.innerHTML = '<tr><td colspan="10">No standings yet — finish fixtures need to sync.</td></tr>';
      return;
    }

    tbody.innerHTML = data.table
      .map(
        (row) => `
        <tr class="team-row" data-team="${escapeHtml(row.team_name)}" tabindex="0">
          <td>${row.position}</td>
          <td>${escapeHtml(row.team_name)}</td>
          <td>${row.played}</td>
          <td>${row.won}</td>
          <td>${row.drawn}</td>
          <td>${row.lost}</td>
          <td>${row.goals_for}</td>
          <td>${row.goals_against}</td>
          <td>${row.goal_diff}</td>
          <td><strong>${row.points}</strong></td>
        </tr>`
      )
      .join('');

    const byName = Object.fromEntries(data.table.map((r) => [r.team_name, r]));
    tbody.querySelectorAll('.team-row').forEach((row) => {
      const show = () => {
        const t = byName[row.dataset.team];
        if (!t || !detail) return;
        detail.textContent = `${t.team_name} — Home ${t.home.won}/${t.home.drawn}/${t.home.lost} (Pts ${t.home.points}) · Away ${t.away.won}/${t.away.drawn}/${t.away.lost} (Pts ${t.away.points})`;
      };
      row.addEventListener('mouseenter', show);
      row.addEventListener('focus', show);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="10">Could not load table: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function updateCountdowns() {
  document.querySelectorAll('.time-left[data-idx]').forEach((el) => {
    const kickoff = fixtureTimers[Number(el.dataset.idx)];
    if (kickoff) el.textContent = timeLeft(kickoff);
  });
}

function timeLeft(kickoffDate) {
  const diff = kickoffDate - new Date();
  if (diff <= 0) return 'Kickoff passed / live window';
  const s = Math.floor((diff / 1000) % 60);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `Starts in ${d}d ${h}h ${m}m ${s}s`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', function () {
  const positionFilter = document.getElementById('position-filter');
  const teamFilter = document.getElementById('team-filter');
  const statFilter = document.getElementById('stat-filter');
  const playersContainer = document.getElementById('players-container');
  const loading = document.getElementById('loading');

  let currentFilters = {
    position: 'ALL',
    team: 'ALL',
    stat: 'points',
  };

  async function loadTeams() {
    try {
      const response = await fetch(FPLHUB.url('teams_list.php'));
      const data = await response.json();
      if (data.success && data.teams) {
        data.teams.forEach((team) => {
          const option = document.createElement('option');
          option.value = team.team_name;
          option.textContent = team.team_name;
          teamFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }

  async function fetchPlayers() {
    loading.style.display = 'block';
    playersContainer.innerHTML = '';

    try {
      const response = await fetch(FPLHUB.url('stats.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFilters),
      });

      const responseText = await response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const data = JSON.parse(responseText.slice(jsonStart, jsonEnd));

      if (data.success && data.players) {
        updateTable(data.players);
      } else {
        playersContainer.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
      }
    } catch (error) {
      console.error('Error:', error);
      playersContainer.innerHTML = '<tr><td colspan="4">Failed to load data</td></tr>';
    } finally {
      loading.style.display = 'none';
    }
  }

  function updateTable(players) {
    playersContainer.innerHTML = '';
    players.forEach((player) => {
      const row = document.createElement('tr');
      row.className = 'player-row';
      const statusClass =
        player.status?.toLowerCase() === 'available'
          ? 'status-available'
          : player.status?.toLowerCase() === 'suspended'
            ? 'status-suspended'
            : 'status-unavailable';

      row.innerHTML = `
        <td>${player.web_name || ''}</td>
        <td class="${statusClass}">${player.status || ''}</td>
        <td>${player.news || '-'}</td>
        <td>${player.stat_value || '0'}</td>
      `;
      playersContainer.appendChild(row);
    });
  }

  [positionFilter, teamFilter, statFilter].forEach((filter) => {
    filter.addEventListener('change', () => {
      currentFilters = {
        position: positionFilter.value,
        team: teamFilter.value,
        stat: statFilter.value,
      };
      fetchPlayers();
    });
  });

  loadTeams().then(fetchPlayers);
});

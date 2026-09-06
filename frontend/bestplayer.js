document.addEventListener('DOMContentLoaded', function () {
  const fixtureTypeSelect = document.getElementById('fixture-type');
  const nextGamesSelect = document.getElementById('next-games');
  const playerStatSelect = document.getElementById('player-stat');
  const playersContainer = document.getElementById('players-container');
  const loading = document.getElementById('loading');

  let currentFilters = {
    fixtureType: 'fdr',
    nextGames: '1',
    playerStat: 'points',
  };

  async function fetchPlayers() {
    loading.style.display = 'block';
    playersContainer.innerHTML = '';

    try {
      const response = await fetch(FPLHUB.url('bestplayer.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFilters),
      });

      const responseText = await response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const data = JSON.parse(responseText.slice(jsonStart, jsonEnd));

      if (data.success && data.players) {
        updatePlayersTable(data.players);
      } else {
        playersContainer.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
      }
    } catch (error) {
      console.error('Error:', error);
      playersContainer.innerHTML = '<tr><td colspan="6">Failed to load data</td></tr>';
    } finally {
      loading.style.display = 'none';
    }
  }

  function updatePlayersTable(players) {
    playersContainer.innerHTML = '';
    players.forEach((player, index) => {
      const row = document.createElement('tr');
      row.className = 'player-row';
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${player.web_name}</td>
        <td>${player.team_name}</td>
        <td>${formatRating(player.fixture_rating)}</td>
        <td><div class="fixtures-list">${formatFixtures(player.fixtures)}</div></td>
        <td>${formatStat(player.stat_value, currentFilters.playerStat)}</td>
      `;
      playersContainer.appendChild(row);
    });
  }

  function formatRating(rating) {
    return parseFloat(rating).toFixed(2);
  }

  function formatFixtures(fixtures) {
    return fixtures
      .map(
        (fixture) =>
          `<span class="fixture-item">${fixture.opp_team} (${fixture.ground === 'home' ? 'H' : 'A'})</span>`
      )
      .join('');
  }

  function formatStat(value, statType) {
    if (typeof value === 'number') {
      return statType.includes('percent') ? `${value}%` : value.toFixed(2);
    }
    return value || '0';
  }

  [fixtureTypeSelect, nextGamesSelect, playerStatSelect].forEach((select) => {
    select.addEventListener('change', () => {
      currentFilters = {
        fixtureType: fixtureTypeSelect.value,
        nextGames: nextGamesSelect.value,
        playerStat: playerStatSelect.value,
      };
      fetchPlayers();
    });
  });

  fetchPlayers();
});

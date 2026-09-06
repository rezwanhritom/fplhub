document.addEventListener('DOMContentLoaded', function () {
  const sortBySelect = document.getElementById('sort-by');
  const nextGamesSelect = document.getElementById('next-games');
  const teamsContainer = document.getElementById('teams-container');
  const loading = document.getElementById('loading');

  let currentFilters = {
    sortBy: 'fdr',
    nextGames: '1',
  };

  async function fetchTeams() {
    loading.style.display = 'block';
    teamsContainer.innerHTML = '';

    try {
      const response = await fetch(FPLHUB.url('bestteam.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFilters),
      });

      const responseText = await response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const data = JSON.parse(responseText.slice(jsonStart, jsonEnd));

      if (data.success && data.teams) {
        updateTeamsTable(data.teams);
      } else {
        teamsContainer.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
      }
    } catch (error) {
      console.error('Error:', error);
      teamsContainer.innerHTML = '<tr><td colspan="4">Failed to load data</td></tr>';
    } finally {
      loading.style.display = 'none';
    }
  }

  function updateTeamsTable(teams) {
    teamsContainer.innerHTML = '';
    teams.forEach((team, index) => {
      const row = document.createElement('tr');
      row.className = 'team-row';
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${team.team_name}</td>
        <td>${formatRating(team.rating)}</td>
        <td><div class="fixtures-list">${formatFixtures(team.fixtures)}</div></td>
      `;
      teamsContainer.appendChild(row);
    });
  }

  function formatRating(rating) {
    return parseFloat(rating).toFixed(2);
  }

  function formatFixtures(fixtures) {
    return fixtures
      .map(
        (fixture) =>
          `<span class="fixture-item">${fixture.opp_team} (${fixture.ground.toLowerCase() === 'home' ? 'H' : 'A'})</span>`
      )
      .join('');
  }

  [sortBySelect, nextGamesSelect].forEach((select) => {
    select.addEventListener('change', () => {
      currentFilters = {
        sortBy: sortBySelect.value,
        nextGames: nextGamesSelect.value,
      };
      fetchTeams();
    });
  });

  fetchTeams();
});

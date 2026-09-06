document.addEventListener('DOMContentLoaded', function () {
  const teamBoxes = document.querySelectorAll('.team-box');
  let selectedTeams = {};

  teamBoxes.forEach((box) => {
    const plusIcon = box.querySelector('.plus-icon');
    const teamSelector = box.querySelector('.team-selector');
    const searchInput = box.querySelector('.team-search');
    const teamsList = box.querySelector('.teams-list');
    const teamStats = box.querySelector('.team-stats');
    const removeButton = box.querySelector('.remove-team');
    const boxIndex = box.dataset.index;

    plusIcon.addEventListener('click', async (e) => {
      e.stopPropagation();
      document.querySelectorAll('.team-selector').forEach((selector) => {
        selector.classList.add('hidden');
      });
      teamSelector.classList.remove('hidden');
      searchInput.focus();

      try {
        const response = await fetch(FPLHUB.url('tvst.php?action=teams'));
        const responseText = await response.text();
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        const data = JSON.parse(responseText.slice(jsonStart, jsonEnd));

        if (data.success && data.teams) {
          updateTeamsList(teamsList, data.teams, boxIndex);
        }
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    });

    searchInput.addEventListener('input', async (e) => {
      const search = e.target.value.trim();
      try {
        const response = await fetch(
          FPLHUB.url(`tvst.php?action=search&query=${encodeURIComponent(search)}`)
        );
        const data = await response.json();
        updateTeamsList(teamsList, data, boxIndex);
      } catch (error) {
        console.error('Search error:', error);
      }
    });

    document.addEventListener('click', (e) => {
      if (!box.contains(e.target)) {
        teamSelector.classList.add('hidden');
      }
    });

    teamSelector.addEventListener('click', (e) => e.stopPropagation());

    removeButton.addEventListener('click', () => {
      delete selectedTeams[boxIndex];
      teamStats.classList.add('hidden');
      plusIcon.parentElement.classList.remove('hidden');
      compareAndHighlight();
    });
  });

  function updateTeamsList(list, teams, boxIndex) {
    list.innerHTML = '';
    teams.forEach((team) => {
      const item = document.createElement('div');
      item.className = 'picker-item team-item';
      item.textContent = team.team_name;
      item.addEventListener('click', () => selectTeam(team, boxIndex));
      list.appendChild(item);
    });
  }

  async function selectTeam(team, boxIndex) {
    try {
      const response = await fetch(
        FPLHUB.url(`tvst.php?action=stats&team_id=${team.team_id}`)
      );
      const stats = await response.json();

      selectedTeams[boxIndex] = stats;

      const box = document.querySelector(`[data-index="${boxIndex}"]`);
      box.querySelector('.add-team').classList.add('hidden');
      box.querySelector('.team-selector').classList.add('hidden');

      const statsDiv = box.querySelector('.team-stats');
      statsDiv.classList.remove('hidden');
      statsDiv.querySelector('.team-name').textContent = team.team_name;

      updateTeamStats(box, stats);
      compareAndHighlight();
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  }

  function updateTeamStats(box, stats) {
    const statsList = box.querySelector('.stats-list');
    statsList.innerHTML = '';

    Object.entries(stats.strength).forEach(([key, value]) => {
      if (!['team_name', 'team_id', 'season_id', 'short_form'].includes(key)) {
        addStatItem(statsList, key, value);
      }
    });

    Object.entries(stats.matches).forEach(([key, value]) => {
      addStatItem(statsList, key, value);
    });
  }

  function addStatItem(container, label, value) {
    const statItem = document.createElement('div');
    statItem.className = 'stat-item';
    statItem.innerHTML = `
      <span class="stat-name">${formatLabel(label)}:</span>
      <span class="stat-value" data-stat="${label}">${value}</span>
    `;
    container.appendChild(statItem);
  }

  function formatLabel(label) {
    return label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function compareAndHighlight() {
    const activeBoxes = Object.keys(selectedTeams);
    if (activeBoxes.length < 2) return;

    const stats = {};
    activeBoxes.forEach((boxIndex) => {
      const teamStats = selectedTeams[boxIndex];
      Object.entries({ ...teamStats.strength, ...teamStats.matches }).forEach(
        ([key, value]) => {
          if (!stats[key]) stats[key] = [];
          stats[key].push({ boxIndex, value: parseFloat(value) || 0 });
        }
      );
    });

    Object.entries(stats).forEach(([key, values]) => {
      const maxValue = Math.max(...values.map((v) => v.value));
      values.forEach(({ boxIndex, value }) => {
        const statElement = document.querySelector(
          `[data-index="${boxIndex}"] [data-stat="${key}"]`
        );
        if (statElement) {
          if (value === maxValue) {
            statElement.classList.add('highest-stat');
          } else {
            statElement.classList.remove('highest-stat');
          }
        }
      });
    });
  }
});

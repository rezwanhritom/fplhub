document.addEventListener('DOMContentLoaded', function () {
  const playerBoxes = document.querySelectorAll('.player-box');
  let selectedPlayers = {};

  playerBoxes.forEach((box) => {
    const plusIcon = box.querySelector('.plus-icon');
    const playerSelector = box.querySelector('.player-selector');
    const searchInput = box.querySelector('.player-search');
    const playersList = box.querySelector('.players-list');
    const playerStats = box.querySelector('.player-stats');
    const removeButton = box.querySelector('.remove-player');
    const boxIndex = box.dataset.index;

    plusIcon.addEventListener('click', async (e) => {
      e.stopPropagation();
      document.querySelectorAll('.player-selector').forEach((selector) => {
        selector.classList.add('hidden');
      });
      playerSelector.classList.remove('hidden');
      searchInput.focus();

      try {
        const response = await fetch(FPLHUB.url('pvsp.php?action=players'));
        const responseText = await response.text();
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        const data = JSON.parse(responseText.slice(jsonStart, jsonEnd));

        if (data.success && data.players) {
          updatePlayersList(playersList, data.players, boxIndex);
        }
      } catch (error) {
        console.error('Error loading players:', error);
      }
    });

    document.addEventListener('click', (e) => {
      if (!box.contains(e.target)) {
        playerSelector.classList.add('hidden');
      }
    });

    playerSelector.addEventListener('click', (e) => e.stopPropagation());

    removeButton.addEventListener('click', () => {
      delete selectedPlayers[boxIndex];
      playerStats.classList.add('hidden');
      plusIcon.parentElement.classList.remove('hidden');
      compareAndHighlight();
    });
  });

  function updatePlayersList(list, players, boxIndex) {
    list.innerHTML = '';
    players.forEach((player) => {
      const item = document.createElement('div');
      item.className = 'picker-item player-item';
      item.textContent = `${player.web_name} (${player.points} pts)`;
      item.addEventListener('click', () => selectPlayer(player, boxIndex));
      list.appendChild(item);
    });
  }

  async function selectPlayer(player, boxIndex) {
    try {
      const response = await fetch(
        FPLHUB.url(`pvsp.php?action=stats&player_id=${player.player_id}`)
      );
      const responseText = await response.text();
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const stats = JSON.parse(responseText.slice(jsonStart, jsonEnd));

      selectedPlayers[boxIndex] = stats;

      const box = document.querySelector(`[data-index="${boxIndex}"]`);
      box.querySelector('.add-player').classList.add('hidden');

      const statsDiv = box.querySelector('.player-stats');
      statsDiv.classList.remove('hidden');
      statsDiv.querySelector('.player-name').textContent = player.web_name;

      updatePlayerStats(box, stats);
      compareAndHighlight();
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  function updatePlayerStats(box, stats) {
    const statsList = box.querySelector('.stats-list');
    statsList.innerHTML = '';

    Object.entries(stats).forEach(([key, value]) => {
      if (
        !['player_name', 'player_id', 'team_name', 'team_id', 'pos', 'web_name', 'status', 'news'].includes(
          key
        )
      ) {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
          <span class="stat-name">${key}:</span>
          <span class="stat-value" data-stat="${key}">${value}</span>
        `;
        statsList.appendChild(statItem);
      }
    });
  }

  function compareAndHighlight() {
    const activeBoxes = Object.keys(selectedPlayers);
    if (activeBoxes.length < 2) return;

    const stats = {};
    activeBoxes.forEach((boxIndex) => {
      Object.entries(selectedPlayers[boxIndex]).forEach(([key, value]) => {
        if (!stats[key]) stats[key] = [];
        stats[key].push({ boxIndex, value: parseFloat(value) || 0 });
      });
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

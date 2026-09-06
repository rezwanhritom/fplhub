let selectedPlayers = { GKP: [], DEF: [], MID: [], FOR: [] };
let teamValue = 0;

function goLogin() {
  location.href = FPLHUB.page('login.html');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch(FPLHUB.url('dash.php?action=get_team'));
    if (!response.ok) {
      if (response.status === 401) return goLogin();
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.team) {
      selectedPlayers = data.team;
      updateTeamDisplay();
    }
    document.getElementById('team-name').textContent = data.fantasy_team || 'Your team';
  } catch (error) {
    console.error(error);
    goLogin();
  }

  document.querySelectorAll('.player-slot').forEach((slot) => {
    slot.addEventListener('click', async function () {
      if (this.classList.contains('filled')) return;
      const players = await getPlayers(this.dataset.position);
      showPlayerSelector(this, players);
    });
  });

  document.getElementById('save-team').addEventListener('click', saveTeam);
});

async function getPlayers(position, search = '') {
  try {
    const response = await fetch(
      FPLHUB.url(`dash.php?action=get_players&position=${position}&search=${encodeURIComponent(search)}`)
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const selectedIds = Object.values(selectedPlayers)
      .flat()
      .filter(Boolean)
      .map((p) => String(p.player_id));
    const playersList = data.players || data || [];
    return playersList.filter((p) => !selectedIds.includes(String(p.player_id)));
  } catch (error) {
    console.error(error);
    return [];
  }
}

function showPlayerSelector(slot, players) {
  const overlay = document.createElement('div');
  overlay.className = 'player-selector';
  const panel = document.createElement('div');
  panel.className = 'player-selector-panel';

  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = `Search ${slot.dataset.position} players…`;

  const list = document.createElement('div');
  list.className = 'player-list';
  updatePlayerList(list, players, slot, overlay);

  search.addEventListener('input', async (e) => {
    const filtered = await getPlayers(slot.dataset.position, e.target.value);
    updatePlayerList(list, filtered, slot, overlay);
  });

  panel.appendChild(search);
  panel.appendChild(list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function updatePlayerList(list, players, slot, overlay) {
  list.innerHTML = '';
  if (!players.length) {
    list.innerHTML = '<div class="empty-state">No players found in database for this filter.</div>';
    return;
  }
  players.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'player-option';
    item.innerHTML = `<span>${player.web_name}</span><span class="muted">£${player.now_cost}m · ${player.points || 0} pts · ${player.selected_by_percent || 0}%</span>`;
    item.addEventListener('click', () => {
      selectPlayer(player, slot);
      overlay.remove();
    });
    list.appendChild(item);
  });
}

function selectPlayer(player, slot) {
  const position = slot.dataset.position;
  if (!selectedPlayers[position]) selectedPlayers[position] = [];
  const slotIndex = Array.from(document.querySelectorAll(`[data-position="${position}"]`)).indexOf(slot);

  selectedPlayers[position][slotIndex] = {
    player_id: player.player_id,
    web_name: player.web_name,
    now_cost: player.now_cost,
    points: player.points,
    position,
  };

  fillSlot(slot, selectedPlayers[position][slotIndex], slotIndex, position);
  updateTeamValue();
  document.getElementById('save-team').classList.remove('hidden');
}

function fillSlot(slot, player, slotIndex, position) {
  const playerInfo = slot.querySelector('.player-info');
  const playerName = slot.querySelector('.player-name');
  const playerStats = slot.querySelector('.player-stats');
  const removeButton = slot.parentElement.querySelector('.remove-player');

  playerInfo.classList.remove('hidden');
  slot.classList.add('filled');
  playerName.textContent = player.web_name;
  playerStats.textContent = `£${player.now_cost}m · ${player.points || 0} pts`;
  removeButton.classList.remove('hidden');
  removeButton.onclick = (e) => {
    e.stopPropagation();
    removePlayer(slot, slotIndex, position);
  };
}

function removePlayer(slot, slotIndex, position) {
  slot.querySelector('.player-info').classList.add('hidden');
  slot.classList.remove('filled');
  if (selectedPlayers[position]) selectedPlayers[position][slotIndex] = null;
  slot.parentElement.querySelector('.remove-player')?.classList.add('hidden');
  updateTeamValue();
  document.getElementById('save-team').classList.remove('hidden');
}

function updateTeamValue() {
  teamValue = Object.values(selectedPlayers)
    .flat()
    .filter(Boolean)
    .reduce((sum, player) => sum + (parseFloat(player.now_cost) || 0), 0);
  document.getElementById('team-value').textContent = `Team value £${teamValue.toFixed(1)}m`;
}

function updateTeamDisplay() {
  document.querySelectorAll('.player-slot').forEach((slot) => {
    const position = slot.dataset.position;
    const slotIndex = Array.from(document.querySelectorAll(`[data-position="${position}"]`)).indexOf(slot);
    const player = selectedPlayers[position]?.[slotIndex];
    if (player) fillSlot(slot, player, slotIndex, position);
  });
  updateTeamValue();
}

async function saveTeam() {
  try {
    const teamData = {};
    Object.entries(selectedPlayers).forEach(([position, players]) => {
      (players || []).forEach((player, index) => {
        if (player) {
          teamData[`${position}_${index}`] = {
            player_id: player.player_id,
            position,
          };
        }
      });
    });

    const response = await fetch(FPLHUB.url('save_team.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Save failed');
    document.getElementById('save-team').classList.add('hidden');
    alert('Team saved successfully!');
  } catch (error) {
    console.error(error);
    alert('Failed to save team. Please try again.');
  }
}

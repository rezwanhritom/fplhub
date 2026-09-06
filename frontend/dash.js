let selectedPlayers = {
    GKP: [], // Array to store multiple GKP players
    DEF: [], // Array to store multiple DEF players
    MID: [], // Array to store multiple MID players
    FOR: []  // Array to store multiple FOR players
};
let teamValue = 0;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost/fpl_hub/dash.php?action=get_team');
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'http://localhost/fpl_hub/login.php';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data.team) {
                selectedPlayers = data.team;
                updateTeamDisplay();
            }
            if (data.fantasy_team) {
                document.getElementById('team-name').textContent = data.fantasy_team;
            }
        } catch (jsonError) {
            console.error('JSON parse error:', text);
            window.location.href = 'http://localhost/fpl_hub/login.php';
        }
    } catch (error) {
        console.error('Error loading team:', error);
        window.location.href = 'http://localhost/fpl_hub/login.php';
    }
});


// Add click handlers to player slots
document.querySelectorAll('.player-slot').forEach(slot => {
    slot.addEventListener('click', async function() {
        const position = this.dataset.position;
        const players = await getPlayers(position);
        showPlayerSelector(this, players);
    });
});

// Fetch players from API
async function getPlayers(position, search = '') {
    try {
        const response = await fetch(`http://localhost/fpl_hub/dash.php?action=get_players&position=${position}&search=${search}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Get currently selected player IDs (excluding null values)
        const selectedIds = Object.values(selectedPlayers)
            .flat()
            .filter(player => player !== null)
            .map(player => player.player_id);
        
        const playersList = data.players || data || [];
        
        // Filter out currently selected players
        return playersList.filter(player => !selectedIds.includes(player.player_id));
    } catch (error) {
        console.error('Error fetching players:', error);
        return [];
    }
}

// Show player selector popup
function showPlayerSelector(slot, players) {
    console.log('Showing selector with players:', players); // Debug log
    const selector = document.createElement('div');
    selector.className = 'player-selector';
    
    const search = document.createElement('input');
    search.type = 'text';
    search.placeholder = 'Search players...';
    search.addEventListener('input', async (e) => {
        const filtered = await getPlayers(slot.dataset.position, e.target.value);
        console.log('Search results:', filtered); // Debug log
        updatePlayerList(selector.querySelector('.player-list'), filtered, slot);
    });
    
    const playerList = createPlayerList(players, slot);
    selector.appendChild(search);
    selector.appendChild(playerList);
    document.body.appendChild(selector);
    
    // Close selector when clicking outside
    document.addEventListener('click', function closeSelector(e) {
        if (!selector.contains(e.target) && e.target !== slot) {
            selector.remove();
            document.removeEventListener('click', closeSelector);
        }
    });
}

// Create player list
function createPlayerList(players, slot) {
    const list = document.createElement('div');
    list.className = 'player-list';
    updatePlayerList(list, players, slot);
    return list;
}

// Update player list with search results
function updatePlayerList(list, players, slot) {
    if (!Array.isArray(players)) {
        console.error('Players is not an array:', players);
        return;
    }
    
    list.innerHTML = '';
    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.textContent = `${player.web_name} (£${player.now_cost}m)`;
        item.addEventListener('click', () => selectPlayer(player, slot));
        list.appendChild(item);
    });
}

// Select player and update team
function selectPlayer(player, slot) {
    const position = slot.dataset.position;
    console.log('Selecting player:', player); // Debug log
    
    // Initialize position array if not exists
    if (!selectedPlayers[position]) {
        selectedPlayers[position] = [];
    }
   
    const slotIndex = Array.from(document.querySelectorAll(`[data-position="${position}"]`)).indexOf(slot);
    
    // Store complete player object
    selectedPlayers[position][slotIndex] = {
        player_id: player.player_id,
        web_name: player.web_name,
        now_cost: player.now_cost,
        points: player.points,
        position: position
    };
    
    console.log('Updated selectedPlayers:', selectedPlayers); // Debug log
    
    // Update player info display
    const playerInfo = slot.querySelector('.player-info');
    const playerName = slot.querySelector('.player-name');
    const playerStats = slot.querySelector('.player-stats');
    
    if (playerInfo && playerName && playerStats) {
        playerInfo.classList.remove('hidden');
        playerName.textContent = player.web_name;
        playerStats.textContent = `£${player.now_cost}m \n ${player.points}pts`;
    }
    
    const removeButton = slot.parentElement.querySelector('.remove-player');
    if (removeButton) {
        removeButton.classList.remove('hidden');
        removeButton.onclick = () => removePlayer(slot, slotIndex, position);
    }
    
    updateTeamValue();
    document.getElementById('save-team').classList.remove('hidden');
    
    const selector = document.querySelector('.player-selector');
    if (selector) selector.remove();
}

// Update removePlayer function
function removePlayer(slot, slotIndex, position) {
    const playerInfo = slot.querySelector('.player-info');
    playerInfo.classList.add('hidden');
    
    if (selectedPlayers[position]) {
        selectedPlayers[position][slotIndex] = null;
    }
    
    const removeButton = slot.parentElement.querySelector('.remove-player');
    if (removeButton) {
        removeButton.classList.add('hidden');
    }
    
    updateTeamValue();
    document.getElementById('save-team').classList.remove('hidden');
}
// Update team value
function updateTeamValue() {
    // Sum up values from all positions
    teamValue = Object.values(selectedPlayers)
        .flat()
        .filter(player => player) // Remove null values
        .reduce((sum, player) => {
            const price = parseFloat(player.now_cost);
            return sum + (isNaN(price) ? 0 : price);
        }, 0);
    
    document.getElementById('team-value').textContent = `Team Value: £${teamValue.toFixed(1)}M`;
}

// Update save team event listener
document.getElementById('save-team').addEventListener('click', async () => {
    try {
        const teamData = {};
        Object.entries(selectedPlayers).forEach(([position, players]) => {
            if (Array.isArray(players)) {
                players.forEach((player, index) => {
                    if (player) {
                        teamData[`${position}_${index}`] = {
                            player_id: player.player_id,
                            position: position
                        };
                    }
                });
            }
        });

        console.log('Sending team data:', teamData); // Debug log

        const response = await fetch('http://localhost/fpl_hub/save_team.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(teamData)
        });

        const responseText = await response.text();
        // Extract JSON part from response
        const jsonMatch = responseText.match(/({.*})/);
        if (!jsonMatch) {
            throw new Error('Invalid response format');
        }

        const data = JSON.parse(jsonMatch[1]);
        console.log('Parsed response:', data);

        if (data.success) {
            document.getElementById('save-team').classList.add('hidden');
            alert('Team saved successfully!');
        } else {
            throw new Error(data.error || 'Failed to save team');
        }
    } catch (error) {
        console.error('Error saving team:', error);
        alert('Failed to save team. Please try again.');
    }
});


// Update team display
// Update updateTeamDisplay function
function updateTeamDisplay() {
    document.querySelectorAll('.player-slot').forEach(slot => {
        const position = slot.dataset.position;
        const slotIndex = Array.from(document.querySelectorAll(`[data-position="${position}"]`)).indexOf(slot);
        const player = selectedPlayers[position]?.[slotIndex];

        if (player) {
            const playerInfo = slot.querySelector('.player-info');
            const playerName = slot.querySelector('.player-name');
            const playerStats = slot.querySelector('.player-stats');
            const removeButton = slot.parentElement.querySelector('.remove-player');

            playerInfo.classList.remove('hidden');
            playerName.textContent = player.web_name;
            playerStats.textContent = `£${player.now_cost}m | ${player.points}pts`;
            removeButton.classList.remove('hidden');
            removeButton.onclick = () => removePlayer(slot, slotIndex, position);
        }
    });
    updateTeamValue();
}

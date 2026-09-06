document.addEventListener('DOMContentLoaded', function() {
    const positionFilter = document.getElementById('position-filter');
    const teamFilter = document.getElementById('team-filter');
    const statFilter = document.getElementById('stat-filter');
    const playersContainer = document.getElementById('players-container');
    const loading = document.getElementById('loading');

    let currentFilters = {
        position: 'ALL',
        team: 'ALL',
        stat: 'points'
    };

    async function fetchPlayers() {
        loading.style.display = 'block';
        playersContainer.innerHTML = '';

        try {
            const response = await fetch('http://localhost/fpl_hub/stats.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentFilters)
            });

            const responseText = await response.text();
            console.log('Raw response:', responseText); // Debug log

            // Extract JSON part from response
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}') + 1;
            const jsonStr = responseText.slice(jsonStart, jsonEnd);
            
            const data = JSON.parse(jsonStr);
            console.log('Parsed data:', data); // Debug log

            if (data.success && data.players) {
                updateTable(data.players);
            } else {
                console.error('Error:', data.error || 'No data received');
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
        const statName = 'stat_value';

        players.forEach(player => {
            const row = document.createElement('tr');
            row.className = 'player-row';
            
            const statusClass = player.status?.toLowerCase() === 'available' ? 'status-available' : 
                              player.status?.toLowerCase() === 'suspended' ? 'status-suspended' : 
                              'status-unavailable';

            row.innerHTML = `
                <td>${player.web_name || ''}</td>
                <td class="${statusClass}">${player.status || ''}</td>
                <td>${player.news || '-'}</td>
                <td>${player[statName] || '0'}</td>
            `;
            playersContainer.appendChild(row);
        });
    }

    // Event listeners
    [positionFilter, teamFilter, statFilter].forEach(filter => {
        filter.addEventListener('change', () => {
            currentFilters = {
                position: positionFilter.value,
                team: teamFilter.value,
                stat: statFilter.value
            };
            fetchPlayers();
        });
    });

    // Initial load
    fetchPlayers();
});
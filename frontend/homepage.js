document.addEventListener("DOMContentLoaded", () => {
    fetchMatchdayNews();
    setInterval(updateTimers, 1000); // Update the timers every second
});

let matchesData = [];

function fetchMatchdayNews() {
    fetch("http://localhost/fpl_hub/fetch_matchweek.php")
        .then(response => response.json())
        .then(data => {
            matchesData = data.content; // Save the match data for later updates
            displayMatchdayNews(matchesData);
        })
        .catch(error => console.error("Error fetching matchday data:", error));
}

function displayMatchdayNews(matches) {
    const matchdayContainer = document.getElementById("matchday-news");
    const matchweekContainer = document.getElementById("matchweek");
    const upcomingMatchesContainer = document.getElementById("upcoming-matches");

    const gameweek = matches[0].gameweek.gameweek;
    matchweekContainer.innerHTML = `Gameweek ${gameweek}`;

    let matchesHTML = '';
    matches.forEach(match => {
        const teams = match.teams.map(team => team.team.name).join(' vs ');
        const kickoff = new Date(match.kickoff.millis);
        const kickoffTime = `${kickoff.toLocaleDateString()} ${kickoff.toLocaleTimeString()}`;

        // Format match data
        const matchDetails = `
            <div class="details">
                <strong>Time Left:</strong> <span class="time-left">${getTimeLeft(kickoff)}</span> <br>
                <strong>Ground:</strong> ${match.ground.name} <br>
                <strong>City:</strong> ${match.ground.city} <br>
            </div>
        `;

        matchesHTML += `
            <div class="match-item">
                <span class="teams">${teams}</span>
                <span class="kickoff-time">${kickoffTime}</span>
                ${matchDetails} <!-- Add match details on hover -->
            </div>
        `;
    });

    upcomingMatchesContainer.innerHTML = matchesHTML;
}

// Calculate time left until the match starts
function getTimeLeft(kickoffDate) {
    const now = new Date();
    const timeDiff = kickoffDate - now;

    if (timeDiff <= 0) {
        return "Kickoff!";
    }

    const seconds = Math.floor((timeDiff / 1000) % 60);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
}

// Update all timers in the list every second
function updateTimers() {
    const timeElements = document.querySelectorAll('.match-item .time-left');

    timeElements.forEach((element, index) => {
        const match = matchesData[index];
        const kickoffDate = new Date(match.kickoff.millis);
        element.textContent = getTimeLeft(kickoffDate); // Update the time left dynamically
    });
}


// Calculate time left until the match starts
function getTimeLeft(kickoffDate) {
    const now = new Date();
    const timeDiff = kickoffDate - now;

    if (timeDiff <= 0) {
        return "Kickoff!";
    }

    const seconds = Math.floor((timeDiff / 1000) % 60);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
}



document.addEventListener("DOMContentLoaded", () => {
    fetchPLTable();
});

function fetchPLTable() {
    fetch("http://localhost/fpl_hub/fetch_pl_table.php") // Fetch from the PHP proxy
        .then(response => response.json())
        .then(data => {
            displayPLTable(data);
        })
        .catch(error => console.error("Error fetching PL table:", error));
}

function displayPLTable(data) {
    const tableContainer = document.getElementById("pl-table");
    const teams = data.tables[0].entries;
    
    let tableHTML = `
        <h2>Premier League Table</h2> <!-- Ensure the heading is within the table container -->
        <table>
            <thead>
                <tr>
                    <th>Team</th>
                    <th>Position</th>
                    <th>Played</th>
                    <th>Won</th>
                    <th>Drawn</th>
                    <th>Lost</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
    `;

    teams.forEach(team => {
        const { team: teamName, position, overall, home, away } = team;
        tableHTML += `
            <tr class="team-row" data-team="${teamName.name}">
                <td>${teamName.name}</td>
                <td>${position}</td>
                <td>${overall.played}</td>
                <td>${overall.won}</td>
                <td>${overall.drawn}</td>
                <td>${overall.lost}</td>
                <td>${overall.goalsFor}</td>
                <td>${overall.goalsAgainst}</td>
                <td>${overall.goalsDifference}</td>
                <td>${overall.points}</td>
            </tr>
            <tr class="home-away-stats" data-team="${teamName.name}">
                <td colspan="10">
                    <div class="home-away">
                        <div class="home">
                            <h4>Home Fixtures</h4>
                            <table>
                                <tr><th>Played</th><th>Won</th><th>Drawn</th><th>Lost</th><th>GF</th><th>GA</th><th>GD</th><th>Points</th></tr>
                                <tr>
                                    <td>${home.played}</td>
                                    <td>${home.won}</td>
                                    <td>${home.drawn}</td>
                                    <td>${home.lost}</td>
                                    <td>${home.goalsFor}</td>
                                    <td>${home.goalsAgainst}</td>
                                    <td>${home.goalsDifference}</td>
                                    <td>${home.points}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="away">
                            <h4>Away Fixtures</h4>
                            <table>
                                <tr><th>Played</th><th>Won</th><th>Drawn</th><th>Lost</th><th>GF</th><th>GA</th><th>GD</th><th>Points</th></tr>
                                <tr>
                                    <td>${away.played}</td>
                                    <td>${away.won}</td>
                                    <td>${away.drawn}</td>
                                    <td>${away.lost}</td>
                                    <td>${away.goalsFor}</td>
                                    <td>${away.goalsAgainst}</td>
                                    <td>${away.goalsDifference}</td>
                                    <td>${away.points}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
        </tbody>
    </table>
    `;

    tableContainer.innerHTML = tableHTML; // This will correctly update the table content without overwriting the heading.

    // Add hover functionality to reveal home and away stats
    const rows = document.querySelectorAll(".team-row");
    rows.forEach(row => {
        row.addEventListener("mouseenter", function() {
            const teamName = row.dataset.team;
            const statsRow = document.querySelector(`.home-away-stats[data-team='${teamName}']`);
            if (statsRow) statsRow.style.display = 'table-row';
        });

        row.addEventListener("mouseleave", function() {
            const teamName = row.dataset.team;
            const statsRow = document.querySelector(`.home-away-stats[data-team='${teamName}']`);
            if (statsRow) statsRow.style.display = 'none';
        });
    });
}

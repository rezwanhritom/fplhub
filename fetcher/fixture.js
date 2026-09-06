function fetchAllTeamsFixtures() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('24/25');
    
    // Get the last row with content to prevent overwriting
    const lastRow = sheet.getLastRow();
  
    // Clear existing data, starting from row 2 (keep the header)
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  
    // Fetch fixture data from the API
    const url = 'https://fantasy.premierleague.com/api/fixtures/';
    const response = UrlFetchApp.fetch(url);
    const fixtures = JSON.parse(response.getContentText());
  
    // Fetch team data to get team names
    const teamsUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    const teamsResponse = UrlFetchApp.fetch(teamsUrl);
    const teamsData = JSON.parse(teamsResponse.getContentText());
    
    // Initialize an empty object to store team names
    const teams = {};
  
    // Populate the teams object with team ID and name
    if (teamsData.teams) {
      teamsData.teams.forEach(team => {
        teams[team.id] = team.name;
      });
    } else {
      Logger.log('Teams data not found');
    }
  
    // Initialize an array to store the rows of data
    let data = [];
  
    // Process each team's fixtures
    teamsData.teams.forEach((team) => {
      const teamId = team.id;
      const teamName = team.name;
  
      // Filter fixtures for the current team
      const teamFixtures = fixtures.filter(fixture => fixture.team_a === teamId || fixture.team_h === teamId);
  
      // Sort fixtures by matchday (event)
      teamFixtures.sort((a, b) => a.event - b.event);
  
      // Populate the fixture data for the current team
      teamFixtures.forEach((fixture) => {
        let matchday = fixture.event;
  
        // Ensure matchday is formatted with leading zero (01, 02, etc.)
        if (matchday < 10) {
          matchday = `0${matchday}`;
        }
  
        const opponentId = fixture.team_a === teamId ? fixture.team_h : fixture.team_a;
        const opponent = teams[opponentId];  // Get opponent name dynamically from the teams object
        const fdr = fixture.difficulty;      // Fixture difficulty rating
        const ground = fixture.team_a === teamId ? 'Away' : 'Home';  // Determine if it's home or away
        const finished = fixture.finished;  // Whether the match has finished or not
        const teamScore = finished ? (fixture.team_a === teamId ? fixture.team_a_score : fixture.team_h_score) : '';
        const opponentScore = finished ? (fixture.team_a === teamId ? fixture.team_h_score : fixture.team_a_score) : '';
        
        // Determine the match result based on scores
        let result = '';
        if (finished) {
          if (teamScore > opponentScore) {
            result = 'Win';
          } else if (teamScore < opponentScore) {
            result = 'Loss';
          } else {
            result = 'Draw';
          }
        }
  
        // Correct Team and Opponent difficulty assignment
        let teamDifficulty = '';
        let opponentDifficulty = '';
        
        if (fixture.team_h === teamId) {
          // Team is playing at home
          teamDifficulty = fixture.team_h_difficulty;
          opponentDifficulty = fixture.team_a_difficulty;
        } else {
          // Team is playing away
          teamDifficulty = fixture.team_a_difficulty;
          opponentDifficulty = fixture.team_h_difficulty;
        }
  
        // MD5 hash of the team name (to be used as team_id in column D)
        const teamIdMD5 = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, teamName);
        const teamIdHex = teamIdMD5.map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');
  
        // MD5 hash of the concatenation of team name and opponent name for FDR ID (to be used as FDR ID in column E)
        const fdrIdMD5 = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, teamName + opponent);
        const fdrIdHex = fdrIdMD5.map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');
  
        // Store the data in an array
        data.push([
          teamName,        // Team Name
          matchday,        // Matchday (formatted with leading zero)
          opponent,        // Opponent
          teamIdHex,       // Team ID (MD5)
          fdrIdHex,        // FDR ID (MD5 of team + opponent)
          ground,          // Ground (Home/Away)
          finished ? 'Done' : 'Not Done',  // Finished (Done/Not Done)
          teamScore,       // Team Score
          opponentScore,   // Opponent Score
          result,          // Result (Win/Loss/Draw)
          teamDifficulty,  // Team Difficulty
          opponentDifficulty, // Opponent Difficulty
          teamDifficulty   // FDR is same as Team Difficulty
        ]);
      });
    });
  
    // Write all the data to the sheet in one go
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    }
  }
  
function generateMatchupDataForMidfielders() {
    const sourceSheetUrl = 'https://docs.google.com/spreadsheets/d/1fJg4aZBobJexgs4nTVvOVjnCeekh8aLabJzaMB6BwKQ/edit?gid=0#gid=0';
    const sourceSheetId = sourceSheetUrl.match(/[-\w]{25,}/)[0]; // Extract Sheet ID from URL
    const sourceSheet = SpreadsheetApp.openById(sourceSheetId).getSheets()[0]; // Open the first sheet
  
    const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("24/25");
  
    // Clear existing data starting from row 2
    const lastRow = targetSheet.getLastRow();
    if (lastRow > 1) {
      targetSheet.getRange(2, 1, lastRow - 1, targetSheet.getLastColumn()).clearContent();
    }
  
    const sourceData = sourceSheet.getDataRange().getValues();
    const rowsToInsert = []; // Array to hold the rows to insert
  
    // Fetch teams and their full names from the Fantasy Premier League API
    const teamFullNames = fetchTeamFullNames();
    if (!teamFullNames) {
      Logger.log("Failed to fetch team full names from the API.");
      return;
    }
  
    Logger.log("Starting data generation for midfielders...");
  
    // Loop through the player data
    for (let i = 1; i < sourceData.length; i++) { // Start from row 2 to skip the header
      const playerName = sourceData[i][0]; // player_name
      const playerId = sourceData[i][1];   // player_id
      const teamId = sourceData[i][3];     // team_id (foreign key)
      const webName = sourceData[i][5];    // web_name
      const pos = sourceData[i][4];        // pos (position)
      const teamName = sourceData[i][2];   // team_name
  
      // Only process if the position is "mid" (midfielder), case-insensitive
      if (pos.toLowerCase() === "mid") {
        Logger.log(`Processing player: ${playerName} - Team: ${teamName}`);
  
        // Find the other 19 teams (excluding player's team)
        const otherTeams = Object.keys(teamFullNames).filter(name => name !== teamName); // Get all teams excluding the player's team
  
        // Generate 38 rows for the player with matchups
        otherTeams.forEach(opponent => {
          const opponentFullName = teamFullNames[opponent];
  
          // Home matchup row
          rowsToInsert.push([
            playerName,  // Column A: Player Name
            playerId,    // Column B: Player ID
            teamId,      // Column C: Team ID
            webName,     // Column D: Web Name
            generateHash(playerName + teamName), // Column E: MID ID (hash of player name + team name)
            opponentFullName, // Column F: Opponent Full Team Name
            "home"       // Column G: Ground
          ]);
  
          // Away matchup row
          rowsToInsert.push([
            playerName,  // Column A: Player Name
            playerId,    // Column B: Player ID
            teamId,      // Column C: Team ID
            webName,     // Column D: Web Name
            generateHash(playerName + teamName), // Column E: MID ID (hash of player name + team name)
            opponentFullName, // Column F: Opponent Full Team Name
            "away"       // Column G: Ground
          ]);
        });
      }
    }
  
    Logger.log(`Generated ${rowsToInsert.length} rows of data.`);
  
    // Insert all rows at once after processing
    if (rowsToInsert.length > 0) {
      targetSheet.getRange(2, 1, rowsToInsert.length, rowsToInsert[0].length)
                 .setValues(rowsToInsert);
    }
  
    Logger.log("Matchup data for midfielders generated and inserted successfully.");
  }
  
  // Fetch team full names from Fantasy Premier League API
  function fetchTeamFullNames() {
    const apiUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    try {
      const response = UrlFetchApp.fetch(apiUrl);
      const data = JSON.parse(response.getContentText());
      const teams = data.teams; // Extract teams from the API response
  
      // Map team names to their full names
      const teamFullNames = {};
      teams.forEach(team => {
        teamFullNames[team.name] = team.name; // Full names from the API
      });
  
      return teamFullNames;
    } catch (error) {
      Logger.log("Error fetching team full names: " + error.message);
      return null;
    }
  }
  
  // Function to generate hash (using MD5 algorithm)
  function generateHash(str) {
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
    return hash.map(byte => (byte < 0 ? byte + 256 : byte) // Convert bytes to unsigned
                 .toString(16).padStart(2, '0')) // Convert to hex
                .join(''); // Join the hex bytes together to form a string
  }
  
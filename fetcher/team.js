function fetchTeamData() {
    // Open the active spreadsheet and the '24/25' sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('24/25');
    
    // Get the team data from the FPL API
    var response = UrlFetchApp.fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    var data = JSON.parse(response.getContentText());
    
    // Get the team data from the response
    var teams = data.teams;
    
    // Prepare an array to hold the team data for insertion
    var teamData = [];
    
    // Function to generate an MD5 hash of a string
    function generateMd5Hash(input) {
      var md5 = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input);
      var hexString = '';
      for (var i = 0; i < md5.length; i++) {
        var hex = (md5[i] & 0xFF).toString(16);
        hexString += (hex.length === 1 ? '0' : '') + hex;
      }
      return hexString;
    }
    
    // Generate the hash of the sheet name
    var sheetNameHash = generateMd5Hash(sheet.getName());
    
    // Loop through the teams and get the necessary information
    teams.forEach(function(team) {
      var teamName = team.name;
      var teamId = generateMd5Hash(teamName); // Generate MD5 hash for the team name
      var shortForm = team.short_name;
      var strength = team.strength; // Overall team strength
      
      // Strength data
      var strengthOverallHome = team.strength_overall_home;
      var strengthOverallAway = team.strength_overall_away;
      var strengthAttackHome = team.strength_attack_home;
      var strengthAttackAway = team.strength_attack_away;
      var strengthDefenceHome = team.strength_defence_home;
      var strengthDefenceAway = team.strength_defence_away;
      
      // Add the team data to the array, including the hash of the sheet name
      teamData.push([teamName, teamId, sheetNameHash, shortForm, strength, strengthOverallHome, 
                     strengthOverallAway, strengthAttackHome, strengthAttackAway, strengthDefenceHome, 
                     strengthDefenceAway]);
    });
    
    // Insert the team data starting from row 2 (assuming header is already in place)
    sheet.getRange(2, 1, teamData.length, 11).setValues(teamData);
    
    Logger.log('Team data has been successfully fetched and inserted.');
  }
  
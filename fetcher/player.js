function updatePlayerStats() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("24/25");
    const url = 'https://fantasy.premierleague.com/api/bootstrap-static/';
  
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    const players = json.elements;
    const teams = json.teams;
  
    const teamDict = {};
    teams.forEach((team) => {
      const teamId = generateHash(team.name);
      teamDict[team.id] = {
        name: team.name,
        id: teamId,
        shortForm: team.short_name.toLowerCase()
      };
    });
  
    const positionMap = {
      1: "GKP",
      2: "DEF",
      3: "MID",
      4: "FOR"
    };
  
    let playerData = [];
  
    players.forEach(player => {
      const playerName = player.first_name + ' ' + player.second_name;
      const playerHash = generateHash(playerName);
      const teamInfo = teamDict[player.team];
      const teamName = teamInfo.name;
      const teamId = teamInfo.id;
      const position = positionMap[player.element_type] || "N/A";
      const fplDisplayName = player.web_name;
      const status = player.status === "i" ? "Injured" : player.status === "s" ? "Suspended" : player.status === "u" ? "Unavailable" : "Available";
      const news = player.news || "";
  
      playerData.push([
        playerName, 
        playerHash, 
        teamName, 
        teamId, 
        position, 
        fplDisplayName, 
        status, 
        news, 
        player.now_cost / 10, 
        player.total_points || 0, 
        player.form || 0, 
        player.minutes || 0, 
        player.goals_scored || 0,
        player.assists || 0,
        player.clean_sheets || 0,
        player.saves || 0,
        player.yellow_cards || 0,
        player.red_cards || 0,
        player.transfers_out || 0,
        player.transfers_out_event || 0,
        player.transfers_in || 0,
        player.transfers_in_event || 0,
        player.selected_by_percent || 0,
        player.cost_change_event || 0,
        player.cost_change_event_fall || 0,
        player.cost_change_start || 0,
        player.cost_change_start_fall || 0,
        player.dreamteam_count || 0,
        player.points_per_game || 0,
        player.value_form || 0,
        player.value_season || 0,
        player.influence || 0,
        player.creativity || 0,
        player.threat || 0,
        player.ict_index || 0,
        player.influence_rank || 0,
        player.influence_rank_type || 0,
        player.creativity_rank || 0,
        player.creativity_rank_type || 0,
        player.threat_rank || 0,
        player.threat_rank_type || 0,
        player.ict_index_rank || 0,
        player.ict_index_rank_type || 0,
        player.corners_and_indirect_freekicks_order || "", 
        player.direct_freekicks_order || "", 
        player.penalties_order || "", 
        player.expected_goals_per_90 || 0, 
        player.saves_per_90 || 0, 
        player.expected_assists_per_90 || 0, 
        player.expected_goal_involvements_per_90 || 0, 
        player.expected_goals_conceded_per_90 || 0, 
        player.goals_conceded_per_90 || 0, 
        player.now_cost_rank || 0, 
        player.now_cost_rank_type || 0, 
        player.form_rank || 0, 
        player.form_rank_type || 0, 
        player.points_per_game_rank || 0, 
        player.points_per_game_rank_type || 0, 
        player.selected_rank || 0, 
        player.selected_rank_type || 0, 
        player.starts_per_90 || 0, 
        player.clean_sheets_per_90 || 0
      ]);
    });
  
    const numberOfColumns = playerData[0].length;
    sheet.getRange(2, 1, playerData.length, numberOfColumns).setValues(playerData);
    sheet.setColumnWidths(1, numberOfColumns, 150);
  }
  
  function generateHash(str) {
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
    return hash.map(byte => (byte < 0 ? byte + 256 : byte)
                 .toString(16).padStart(2, '0'))
                .join('');
  }
  
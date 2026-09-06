function fetchGameweekData() {
    const url = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    // Extract event (gameweek) data
    const events = data.events;
    
    // Extract elements (players) data
    const elements = data.elements;
  
    // Create a map of player id to web_name for quick lookup
    const playerWebNames = {};
    elements.forEach(player => {
      playerWebNames[player.id] = player.web_name;
    });
    
    // Open the "24/25" sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('24/25');
    
    // Generate the MD5 hash of the sheet name
    const sheetNameHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, sheet.getName())
      .map(byte => (byte + 256).toString(16).slice(-2))
      .join('');
  
    // Loop through events and insert data into the sheet
    events.forEach((event, index) => {
      // Skip headers (row 1)
      const row = index + 2; // Data starts from row 2
  
      const chipPlays = {
        bboost: '',
        freehit: '',
        wildcard: '',
        '3xc': ''
      };
  
      // Extract chip plays
      event.chip_plays.forEach(chip => {
        if (chip.chip_name === 'bboost') {
          chipPlays.bboost = chip.num_played;
        } else if (chip.chip_name === 'freehit') {
          chipPlays.freehit = chip.num_played;
        } else if (chip.chip_name === 'wildcard') {
          chipPlays.wildcard = chip.num_played;
        } else if (chip.chip_name === '3xc') {
          chipPlays['3xc'] = chip.num_played;
        }
      });
  
      // Map IDs to web_names for the required fields
      const mostSelectedName = playerWebNames[event.most_selected] || '';
      const mostTransferredInName = playerWebNames[event.most_transferred_in] || '';
      const topElementName = playerWebNames[event.top_element] || '';
      const mostCaptainedName = playerWebNames[event.most_captained] || '';
      const mostViceCaptainedName = playerWebNames[event.most_vice_captained] || '';
  
      // Generate the gw_id (MD5 hash of gameweek name)
      const gw_id = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, event.name)
        .map(byte => (byte + 256).toString(16).slice(-2))
        .join('');
  
      // Prepare the row data
      const rowData = [
        event.name,
        gw_id, // Add the gw_id after the gameweek name
        sheetNameHash, // Add the hash of the sheet name after gw_id
        event.deadline_time,
        event.finished,
        event.average_entry_score,
        event.highest_score,
        event.is_previous,
        event.is_current,
        event.is_next,
        event.can_enter,
        event.can_manage,
        chipPlays.bboost,
        chipPlays.freehit,
        chipPlays.wildcard,
        chipPlays['3xc'],
        mostSelectedName,
        mostTransferredInName,
        topElementName,
        event.top_element_info ? event.top_element_info.points : '',
        mostCaptainedName,
        mostViceCaptainedName,
        event.transfers_made
      ];
  
      // Write the data to the sheet
      sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
    });
  }
  
function fetchAndAddBootstrapData() {
    // Define the URL or API endpoint for fetching the data
    const apiUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/'; // Assuming the endpoint
    const response = UrlFetchApp.fetch(apiUrl); // Fetch data from the API
    const data = JSON.parse(response.getContentText()); // Parse the JSON response
  
    // Get the relevant data from the API
    const bootstrapData = data.phases;
  
    // Open the "24/25" sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('24/25');
  
    // Generate the MD5 hash of the sheet name
    const sheetNameHash = getMD5Hex(sheet.getName());
  
    // Clear existing data except for the header (row 1)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  
    // Prepare the new data to be appended
    const newData = [];
    bootstrapData.forEach(function(phase) {
      const md5Hash = getMD5Hex(phase.name); // Generate MD5 hash in hexadecimal format
      newData.push([phase.name, md5Hash, sheetNameHash, phase.highest_score, phase.start_event, phase.stop_event]);
    });
  
    // If there is new data, insert it into the sheet starting from row 2
    if (newData.length > 0) {
      sheet.getRange(2, 1, newData.length, newData[0].length).setValues(newData);
    }
  }
  
  // Function to compute the MD5 hash in raw hexadecimal format (32 characters)
  function getMD5Hex(input) {
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input);
    var hexString = hash.map(function(byte) {
      return ('00' + (byte & 0xFF).toString(16)).slice(-2); // Convert each byte to 2-character hex
    }).join('');
    return hexString; // Return the 32-character MD5 hash
  }
  
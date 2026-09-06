<?php
require_once 'google_auth.php'; // Include Google Sheets API setup
require_once 'dbconnect.php'; // Include database connection setup

// Ensure that $service is initialized properly
if (!isset($service)) {
    die("Error: Google Sheets service is not initialized.");
}

// Function to fetch data from Google Sheets
function fetchDataFromSheet($service, $spreadsheetId, $range) {
    echo "Attempting to fetch data from range: " . $range . "\n"; // Debugging
    try {
        $response = $service->spreadsheets_values->get($spreadsheetId, $range);
        $values = $response->getValues();

        if (empty($values)) {
            echo "No data found in the specified range.\n";
            return [];
        } else {
            echo "Fetched data from Google Sheets:\n";
            print_r($values); // Debug: Print fetched data
            return $values;
        }
    } catch (Exception $e) {
        die("Error fetching data from Google Sheets: " . $e->getMessage());
    }
}

// Function to clear all existing values from the database table
function clearDatabaseTable($pdo, $tableName) {
    echo "Clearing all existing values in the database table: " . $tableName . "\n";
    try {
        $pdo->exec("DELETE FROM " . $tableName);
        echo "All values cleared successfully.\n";
    } catch (PDOException $e) {
        die("Error clearing database table: " . $e->getMessage());
    }
}

// Function to insert data into the FPL_HUB_GW_Data table
function insertFPLHubGWData($pdo, $data) {
    echo "Attempting to insert data into database...\n"; // Debugging
    $query = "INSERT INTO fpl_hub_gw_data (gw, gw_id, season_id, gw_deadline, status, average_score, highest_score, 
              event_is_pre, event_is_cur, event_is_next, event_can_enter, event_can_manage, bboost_count, 
              freehit_count, wildcard_count, 3xc_count, most_selected, most_ti, highest_player, hp_score, most_c, 
              most_vc, transfers_made, pyfy) 
              VALUES (:gw, :gw_id, :season_id, :gw_deadline, :status, :average_score, :highest_score, 
                      :event_is_pre, :event_is_cur, :event_is_next, :event_can_enter, :event_can_manage, :bboost_count, 
                      :freehit_count, :wildcard_count, :xc_count, :most_selected, :most_ti, :highest_player, :hp_score, 
                      :most_c, :most_vc, :transfers_made, :pyfy)
              ON DUPLICATE KEY UPDATE 
                  pyfy = VALUES(pyfy)";
    
    $stmt = $pdo->prepare($query);

    try {
        foreach ($data as $row) {
            $stmt->execute([
                ':gw' => $row['gw'],
                ':gw_id' => $row['gw_id'],
                ':season_id' => $row['season_id'],
                ':gw_deadline' => $row['gw_deadline'],
                ':status' => $row['status'],
                ':average_score' => $row['average_score'],
                ':highest_score' => $row['highest_score'],
                ':event_is_pre' => $row['event_is_pre'],
                ':event_is_cur' => $row['event_is_cur'],
                ':event_is_next' => $row['event_is_next'],
                ':event_can_enter' => $row['event_can_enter'],
                ':event_can_manage' => $row['event_can_manage'],
                ':bboost_count' => $row['bboost_count'],
                ':freehit_count' => $row['freehit_count'],
                ':wildcard_count' => $row['wildcard_count'],
                ':xc_count' => $row['3xc_count'],
                ':most_selected' => $row['most_selected'],
                ':most_ti' => $row['most_ti'],
                ':highest_player' => $row['highest_player'],
                ':hp_score' => $row['hp_score'],
                ':most_c' => $row['most_c'],
                ':most_vc' => $row['most_vc'],
                ':transfers_made' => $row['transfers_made'],
                ':pyfy' => $row['pyfy']
            ]);
        }
        echo "Data successfully inserted into FPL_HUB_GW_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into database: " . $e->getMessage());
    }
}

// Define Google Sheets details
$spreadsheetId = '12niXzAw-2nm-__ccXM-IBhR5dUKAnJuyo9B5mZdHx18'; // Your Google Sheet ID
$range = '24/25!A2:Z'; // Update range as needed

// Clear existing values from the database
clearDatabaseTable($pdo, 'fpl_hub_gw_data');

// Fetch data from the Google Sheet
echo "Fetching data from Google Sheets...\n"; // Debugging
$data = fetchDataFromSheet($service, $spreadsheetId, $range);

if (empty($data)) {
    echo "No data retrieved from Google Sheets.\n";
    exit;
}

// Format data for database insertion
$formattedData = [];
foreach ($data as $row) {
    if (isset($row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7], $row[8], $row[9], $row[10], $row[11], $row[12], $row[13], $row[14], $row[15], $row[16], $row[17], $row[18], $row[19], $row[20], $row[21], $row[22], $row[23])) { // Ensure all required fields exist
        $formattedData[] = [
            'gw' => $row[0],
            'gw_id' => $row[1],
            'season_id' => $row[2],
            'gw_deadline' => $row[3],
            'status' => $row[4],
            'average_score' => $row[5],
            'highest_score' => $row[6],
            'event_is_pre' => $row[7],
            'event_is_cur' => $row[8],
            'event_is_next' => $row[9],
            'event_can_enter' => $row[10],
            'event_can_manage' => $row[11],
            'bboost_count' => $row[12],
            'freehit_count' => $row[13],
            'wildcard_count' => $row[14],
            '3xc_count' => $row[15],
            'most_selected' => $row[16],
            'most_ti' => $row[17],
            'highest_player' => $row[18],
            'hp_score' => $row[19],
            'most_c' => $row[20],
            'most_vc' => $row[21],
            'transfers_made' => $row[22],
            'pyfy' => $row[23]
        ];
    }
}
echo "Formatted data for database:\n"; 
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubGWData($pdo, $formattedData);
?>



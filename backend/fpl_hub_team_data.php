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

// Function to insert data into the FPL_HUB_Team_Data table
function insertFPLHubTeamData($pdo, $data) {
    echo "Attempting to insert data into database...\n"; // Debugging
    $query = "INSERT INTO fpl_hub_team_data (team_name, team_id, season_id, short_form, strength, strength_home, 
              strength_away, strength_home_att, strength_away_att, strength_home_def, strength_away_def, pyfy)
              VALUES (:team_name, :team_id, :season_id, :short_form, :strength, :strength_home, :strength_away, 
                      :strength_home_att, :strength_away_att, :strength_home_def, :strength_away_def, :pyfy)
              ON DUPLICATE KEY UPDATE 
                  team_name = VALUES(team_name),
                  season_id = VALUES(season_id),
                  short_form = VALUES(short_form),
                  strength = VALUES(strength),
                  strength_home = VALUES(strength_home),
                  strength_away = VALUES(strength_away),
                  strength_home_att = VALUES(strength_home_att),
                  strength_away_att = VALUES(strength_away_att),
                  strength_home_def = VALUES(strength_home_def),
                  strength_away_def = VALUES(strength_away_def)";
    
    $stmt = $pdo->prepare($query);

    try {
        foreach ($data as $row) {
            $stmt->execute([
                ':team_name' => $row['team_name'],
                ':team_id' => $row['team_id'],
                ':season_id' => $row['season_id'],
                ':short_form' => $row['short_form'],
                ':strength' => $row['strength'],
                ':strength_home' => $row['strength_home'],
                ':strength_away' => $row['strength_away'],
                ':strength_home_att' => $row['strength_home_att'],
                ':strength_away_att' => $row['strength_away_att'],
                ':strength_home_def' => $row['strength_home_def'],
                ':strength_away_def' => $row['strength_away_def'],
                ':pyfy' => $row['pyfy']
            ]);
        }
        echo "Data successfully inserted into FPL_HUB_Team_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into database: " . $e->getMessage());
    }
}

// Define Google Sheets details
$spreadsheetId = '11cbqFIGSMljPi_7iCBXSFnNWAMue0K_wW_w5XV-duQo'; // Your Google Sheet ID
$range = '24/25!A2:L'; // Data range in your Google Sheet

// Fetch data from the Google Sheet
echo "Fetching data from Google Sheets...\n"; // Debugging
$data = fetchDataFromSheet($service, $spreadsheetId, $range);

if (empty($data)) {
    echo "No data retrieved from Google Sheets.\n";
    exit;
}

// Format data for insertion into the database
$formattedData = [];
foreach ($data as $row) {
    if (isset($row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7], $row[8], $row[9], $row[10], $row[11])) {
        $formattedData[] = [
            'team_name' => $row[0],
            'team_id' => $row[1],
            'season_id' => $row[2],
            'short_form' => $row[3],
            'strength' => $row[4],
            'strength_home' => $row[5],
            'strength_away' => $row[6],
            'strength_home_att' => $row[7],
            'strength_away_att' => $row[8],
            'strength_home_def' => $row[9],
            'strength_away_def' => $row[10],
            'pyfy' => $row[11]
        ];
    }
}
echo "Formatted data for database:\n";
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubTeamData($pdo, $formattedData);
?>

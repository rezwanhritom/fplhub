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

// Function to insert data into the FPL_HUB_MID_Data table
function insertFPLHubMIDData($pdo, $data) {
    echo "Attempting to insert data into database...\n"; // Debugging
    $query = "INSERT INTO FPL_HUB_MID_Data (player_name, player_id, team_id, web_name, mid_id, opp_team, ground, team_score, opp_score, result, points, saves, minutes, goals, assists, xg, xa, xgi, cs, goals_conceded, xgc, own_goals, penalties_saved, penalties_missed, yellow_cards, red_cards, shots, bonus, bps, influence, creativity, threat, ict_index, transfers_balance, selected, pyfy)
              VALUES (:player_name, :player_id, :team_id, :web_name, :mid_id, :opp_team, :ground, :team_score, :opp_score, :result, :points, :saves, :minutes, :goals, :assists, :xg, :xa, :xgi, :cs, :goals_conceded, :xgc, :own_goals, :penalties_saved, :penalties_missed, :yellow_cards, :red_cards, :shots, :bonus, :bps, :influence, :creativity, :threat, :ict_index, :transfers_balance, :selected, :pyfy)";

    $stmt = $pdo->prepare($query);

    try{
        foreach ($data as $row) {
            $stmt->execute([
                ':player_name' => $row['player_name'],
                ':player_id' => $row['player_id'],
                ':team_id' => $row['team_id'],
                ':web_name' => $row['web_name'],
                ':mid_id' => $row['mid_id'],
                ':opp_team' => $row['opp_team'],
                ':ground' => $row['ground'],
                ':team_score' => $row['team_score'],
                ':opp_score' => $row['opp_score'],
                ':result' => $row['result'],
                ':points' => $row['points'],
                ':saves' => $row['saves'],
                ':minutes' => $row['minutes'],
                ':goals' => $row['goals'],
                ':assists' => $row['assists'],
                ':xg' => $row['xg'],
                ':xa' => $row['xa'],
                ':xgi' => $row['xgi'],
                ':cs' => $row['cs'],
                ':goals_conceded' => $row['goals_conceded'],
                ':xgc' => $row['xgc'],
                ':own_goals' => $row['own_goals'],
                ':penalties_saved' => $row['penalties_saved'],
                ':penalties_missed' => $row['penalties_missed'],
                ':yellow_cards' => $row['yellow_cards'],
                ':red_cards' => $row['red_cards'],
                ':shots' => $row['shots'],
                ':bonus' => $row['bonus'],
                ':bps' => $row['bps'],
                ':influence' => $row['influence'],
                ':creativity' => $row['creativity'],
                ':threat' => $row['threat'],
                ':ict_index' => $row['ict_index'],
                ':transfers_balance' => $row['transfers_balance'],
                ':selected' => $row['selected'],
                ':pyfy' => $row['pyfy']
            ]);
        }
        echo "Data successfully inserted into FPL_HUB_MID_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into database: " . $e->getMessage());
    }
}

// Define Google Sheets details
$spreadsheetId = '1Brj-5mtBa0ulIKQvry1lE0oeHgwc077Jm63Dg4f0RZQ';
$range = '24/25!A2:AJ';

// Clear existing values from the database table
clearDatabaseTable($pdo, 'fpl_hub_mid_data');

// Fetch data from Google Sheets
echo "Fetching data from Google Sheets...\n"; // Debugging
$data = fetchDataFromSheet($service, $spreadsheetId, $range);

if (empty($data)) {
    echo "No data retrieved from Google Sheets.\n";
    exit;
}

// Format data for database insertion
$formattedData = [];
foreach ($data as $row) {
    if (isset($row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7], $row[8], $row[9], $row[10], $row[11], $row[12], $row[13], $row[14], $row[15], $row[16], $row[17], $row[18], $row[19], $row[20], $row[21], $row[22], $row[23], $row[24], $row[25], $row[26], $row[27], $row[28], $row[29], $row[30], $row[31], $row[32], $row[33], $row[34], $row[35])) {
        $formattedData[] = [
            'player_name' => $row[0],
            'player_id' => $row[1],
            'team_id' => $row[2],
            'web_name' => $row[3],
            'mid_id' => $row[4],
            'opp_team' => $row[5],
            'ground' => $row[6],
            'team_score' => $row[7],
            'opp_score' => $row[8],
            'result' => $row[9],
            'points' => $row[10],
            'saves' => $row[11],
            'minutes' => $row[12],
            'goals' => $row[13],
            'assists' => $row[14],
            'xg' => $row[15],
            'xa' => $row[16],
            'xgi' => $row[17],
            'cs' => $row[18],
            'goals_conceded' => $row[19],
            'xgc' => $row[20],
            'own_goals' => $row[21],
            'penalties_saved' => $row[22],
            'penalties_missed' => $row[23],
            'yellow_cards' => $row[24],
            'red_cards' => $row[25],
            'shots' => $row[26],
            'bonus' => $row[27],
            'bps' => $row[28],
            'influence' => $row[29],
            'creativity' => $row[30],
            'threat' => $row[31],
            'ict_index' => $row[32],
            'transfers_balance' => $row[33],
            'selected' => $row[34],
            'pyfy' => $row[35]
        ];
    }
}
echo "Formatted data for database:\n";
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubMIDData($pdo, $formattedData);
?>

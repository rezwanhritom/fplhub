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

// Function to insert data into the FPL_HUB_Fixture_Data table
function insertFPLHubFixtureData($pdo, $data) {
    echo "Attempting to insert data into database...\n"; // Debugging
    $query = "INSERT INTO fpl_hub_fixture_data (team_name, gameweek, opp_team, team_id, fdr_id, ground, status, 
              team_score, opp_score, result, team_diff, opp_diff, fdr, pyfy)
              VALUES (:team_name, :gameweek, :opp_team, :team_id, :fdr_id, :ground, :status, :team_score, 
                      :opp_score, :result, :team_diff, :opp_diff, :fdr, :pyfy)
              ON DUPLICATE KEY UPDATE 
                  pyfy = VALUES(pyfy)";
    
    $stmt = $pdo->prepare($query);

    try {
        foreach ($data as $row) {
            $stmt->execute([
                ':team_name' => $row['team_name'],
                ':gameweek' => $row['gameweek'],
                ':opp_team' => $row['opp_team'],
                ':team_id' => $row['team_id'],
                ':fdr_id' => $row['fdr_id'],
                ':ground' => $row['ground'],
                ':status' => $row['status'],
                ':team_score' => $row['team_score'],
                ':opp_score' => $row['opp_score'],
                ':result' => $row['result'],
                ':team_diff' => $row['team_diff'],
                ':opp_diff' => $row['opp_diff'],
                ':fdr' => $row['fdr'],
                ':pyfy' => $row['pyfy']
            ]);
        }
        echo "Data successfully inserted into FPL_HUB_Fixture_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into database: " . $e->getMessage());
    }
}

//Define the spreadsheet ID and range
$spreadsheetId = '1gIj8EhuhKr4KwivziOwB9yB-y8Du7AMNovIKOwEj520';
$range = '24/25!A2:N';

// Clear existing values from the database table
clearDatabaseTable($pdo, 'fpl_hub_fixture_data');
$data = fetchDataFromSheet($service, $spreadsheetId, $range);

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
    if (isset($row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7], $row[8], $row[9], $row[10], $row[11], $row[12], $row[13])) {
        $formattedData[] = [
            'team_name' => $row[0],
            'gameweek' => $row[1],
            'opp_team' => $row[2],
            'team_id' => $row[3],
            'fdr_id' => $row[4],
            'ground' => $row[5],
            'status' => $row[6],
            'team_score' => $row[7],
            'opp_score' => $row[8],
            'result' => $row[9],
            'team_diff' => $row[10],
            'opp_diff' => $row[11],
            'fdr' => $row[12],
            'pyfy' => $row[13]
        ];
    }
}
echo "Formatted data for database:\n";
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubFixtureData($pdo, $formattedData);
?>

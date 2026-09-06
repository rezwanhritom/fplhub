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

// Function to clear existing data in the FPL_HUB_Monthly_Data table
function clearDatabaseTable($pdo, $tableName) {
    echo "Clearing all existing values in the database table: " . $tableName . "\n";
    try {
        $pdo->exec("DELETE FROM " . $tableName);
        echo "All values cleared successfully.\n";
    } catch (PDOException $e) {
        die("Error clearing database table: " . $e->getMessage());
    }
}

// Function to insert data into the FPL_HUB_Monthly_Data table
function insertFPLHubMonthlyData($pdo, $data) {
    echo "Attempting to insert data into the database...\n"; // Debugging
    $query = "INSERT INTO fpl_hub_monthly_data (name, month_id, season_id, start_gw, stop_gw, highest_point, pyfy)
              VALUES (:name, :month_id, :season_id, :start_gw, :stop_gw, :highest_point, :pyfy)
              On DUPLICATE KEY UPDATE
                pyfy = VALUES(pyfy)";

    $stmt = $pdo->prepare($query);

    try {
        foreach ($data as $row) {
            $stmt->execute([
                ':name' => $row['name'],
                ':month_id' => $row['month_id'],
                ':season_id' => $row['season_id'],
                ':start_gw' => $row['start_gw'],
                ':stop_gw' => $row['stop_gw'],
                ':highest_point' => $row['highest_point'],
                ':pyfy' => $row['pyfy']
            ]);
        }
        echo "Data successfully inserted into the FPL_HUB_Monthly_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into the database: " . $e->getMessage());
    }
}

// Define Google Sheets details
$spreadsheetId = '1gqkVjP1QJ5H_CGN56ncsjZE0Gd0bxh1pk51uLHeIYeI'; // Your Google Sheet ID
$range = '24/25!A2:G'; // Update range to include the 'year' column

// Clear existing data in the database
clearDatabaseTable($pdo, 'fpl_hub_monthly_data');

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
    if (isset($row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6])) { // Ensure all fields exist
        $formattedData[] = [
            'name' => $row[0],
            'month_id' => $row[1],
            'season_id' => $row[2],
            'start_gw' => $row[3],
            'stop_gw' => $row[4],
            'highest_point' => $row[5],
            'pyfy' => $row[6]
        ];
    }
}
echo "Formatted data for database:\n"; 
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubMonthlyData($pdo, $formattedData);
?>

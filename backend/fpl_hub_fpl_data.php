<?php
require_once 'google_auth.php'; // Include Google Sheets API setup
require_once 'dbconnect.php'; // Include database connection setup

// Ensure that $service is initialized properly
if (!isset($service)) {
    die("Error: Google Sheets service is not initialized.");
}

// Function to fetch data from Google Sheets
function fetchDataFromSheet($service, $spreadsheetId, $range) {
    echo "Attempting to fetch data from Google Sheets...\n"; // Debugging
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

// Function to insert data into the FPL_HUB_FPL_Data table
function insertFPLHubFPLData($pdo, $data) {
    echo "Attempting to insert data into database...\n"; // Debugging
    $query = "INSERT INTO fpl_hub_fpl_data (season, season_id) 
              VALUES (:season, :season_id)
              ON DUPLICATE KEY UPDATE 
                  season = VALUES(season)";
    
    $stmt = $pdo->prepare($query);

    try {
        foreach ($data as $row) {
            $stmt->execute([
                ':season' => $row['season'],
                ':season_id' => $row['season_id']
            ]);
        }
        echo "Data successfully inserted into FPL_HUB_FPL_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into database: " . $e->getMessage());
    }
}

// Define Google Sheets details
$spreadsheetId = '1UiuYfMSrpGAhaBkjKo84cNJaxLJEU4By00XnrxPeyJg'; // Your Google Sheet ID
$range = 'SHEET!A2:B'; // The range to fetch

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
    if (isset($row[0], $row[1])) { // Ensure both season and season_id exist
        $formattedData[] = [
            'season' => $row[0],
            'season_id' => $row[1]
        ];
    }
}
echo "Formatted data for database:\n"; 
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubFPLData($pdo, $formattedData);
?>

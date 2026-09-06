<?php
// Set the API URL
$apiUrl = 'https://footballapi.pulselive.com/football/fixtures?statuses=U,L,C,A&pageSize=10&startDate=2025-01-04&endDate=2025-01-06&page=0&gameweeks=18409&altIds=true&fast=false';

// Set the headers to allow access from any origin
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

// Execute the cURL request
$response = curl_exec($ch);

// Check for errors
if ($response === false) {
    echo json_encode(['error' => 'Unable to fetch data from the API']);
    exit;
}

// Close cURL
curl_close($ch);

// Return the response
echo $response;
?>

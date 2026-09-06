<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$api_url = "https://footballapi.pulselive.com/football/standings?compSeasons=719&altIds=true";

// Use cURL to fetch the API data
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL verification if needed
$response = curl_exec($ch);
curl_close($ch);

if ($response) {
    echo $response;
} else {
    echo json_encode(["error" => "Unable to fetch data"]);
}
?>

<?php
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/vendor/autoload.php';

if (!isset($_GET['code'])) {
    die("Error: Authorization code missing!");
}

$client = new Google_Client();
$client->setClientId(env('GOOGLE_SHEETS_CLIENT_ID'));
$client->setClientSecret(env('GOOGLE_SHEETS_CLIENT_SECRET'));
$client->setRedirectUri(env('GOOGLE_SHEETS_REDIRECT_URI'));
$client->setApplicationName('fplhub');
$client->setAccessType('offline');

try {
    $authCode = $_GET['code'];
    $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);

    if (isset($accessToken['error'])) {
        die('Error fetching access token: ' . $accessToken['error']);
    }

    $client->setAccessToken($accessToken);

    $tokenPath = resolveBackendPath(env('GOOGLE_TOKEN_PATH', 'token.json'));
    file_put_contents($tokenPath, json_encode($accessToken));

    echo "Authentication successful! Token saved to 'token.json'.";
} catch (Exception $e) {
    die('Error during token exchange: ' . $e->getMessage());
}

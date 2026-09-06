<?php
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/vendor/autoload.php';

$client = new Google_Client();
$client->setClientId(env('GOOGLE_SHEETS_CLIENT_ID'));
$client->setClientSecret(env('GOOGLE_SHEETS_CLIENT_SECRET'));
$client->setRedirectUri(env('GOOGLE_SHEETS_REDIRECT_URI'));
$client->setScopes([Google_Service_Sheets::SPREADSHEETS]);
$client->setAccessType('offline');
$client->setPrompt('select_account consent');

$tokenPath = resolveBackendPath(env('GOOGLE_TOKEN_PATH', 'token.json'));

if (file_exists($tokenPath)) {
    $accessToken = json_decode(file_get_contents($tokenPath), true);
    $client->setAccessToken($accessToken);
}

if ($client->getAccessToken() && !$client->isAccessTokenExpired()) {
    echo "Authenticated successfully! You can now use the Google Sheets API.\n";
    $service = new Google_Service_Sheets($client);
} else {
    $authUrl = $client->createAuthUrl();
    header('Location: ' . $authUrl);
    exit;
}

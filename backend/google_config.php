<?php
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/vendor/autoload.php';

$google_client = new Google_Client();
$google_client->setClientId(env('GOOGLE_CLIENT_ID'));
$google_client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
$google_client->setRedirectUri(env('GOOGLE_REDIRECT_URI'));
$google_client->addScope('email');
$google_client->addScope('profile');

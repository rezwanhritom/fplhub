<?php
require_once __DIR__ . '/env.php';

$credentialsPath = resolveBackendPath(env('GOOGLE_CREDENTIALS_PATH', 'credentials.json'));

echo "Checking file at: " . htmlspecialchars($credentialsPath) . "<br>";

if (file_exists($credentialsPath)) {
    echo 'File exists!';
} else {
    echo 'File not found!';
}

<?php
require_once __DIR__ . '/env.php';

$host = env('DB_HOST', 'localhost');
$port = env('DB_PORT', '3306');
$db = env('DB_NAME', 'fpl_hub');
$user = env('DB_USER', 'root');
$pass = env('DB_PASS', '');
$sslCa = env('DB_SSL_CA');

$dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

if ($sslCa) {
    $caPath = resolveBackendPath($sslCa);
    if (!is_readable($caPath)) {
        die('Database SSL CA file not found or unreadable: ' . $caPath);
    }
    $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
    // Required for many Aiven / cloud MySQL setups with PDO+mysqlnd
    if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    }
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

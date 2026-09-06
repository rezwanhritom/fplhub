<?php
/**
 * Quick connectivity check for Aiven / local MySQL.
 * Run: php backend/test_db.php
 */
require_once __DIR__ . '/dbconnect.php';

$stmt = $pdo->query('SELECT VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS user');
$row = $stmt->fetch();

header('Content-Type: text/plain; charset=utf-8');
echo "Database connection OK\n";
echo "Version: {$row['version']}\n";
echo "Database: {$row['db']}\n";
echo "User: {$row['user']}\n";

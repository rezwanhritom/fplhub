<?php
require_once __DIR__ . '/dbconnect.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $stmt = $pdo->query("
        SELECT team_id, team_name, short_form
        FROM fpl_hub_team_data
        ORDER BY team_name ASC
    ");
    echo json_encode([
        'success' => true,
        'teams' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

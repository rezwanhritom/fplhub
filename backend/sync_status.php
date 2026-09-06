<?php
/**
 * Sync health endpoint for the dashboard / debugging.
 * GET /backend/sync_status.php
 */
require_once __DIR__ . '/dbconnect.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query('SELECT meta_key, meta_value, updated_at FROM sync_meta');
    $meta = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $meta[$row['meta_key']] = [
            'value' => $row['meta_value'],
            'updated_at' => $row['updated_at'],
        ];
    }

    $counts = [
        'players' => (int)$pdo->query('SELECT COUNT(*) FROM fpl_hub_player_data')->fetchColumn(),
        'teams' => (int)$pdo->query('SELECT COUNT(*) FROM fpl_hub_team_data')->fetchColumn(),
        'fixtures' => (int)$pdo->query('SELECT COUNT(*) FROM fpl_hub_fixture_data')->fetchColumn(),
        'gameweeks' => (int)$pdo->query('SELECT COUNT(*) FROM fpl_hub_gw_data')->fetchColumn(),
    ];

    echo json_encode([
        'success' => true,
        'meta' => $meta,
        'counts' => $counts,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

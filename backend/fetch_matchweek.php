<?php
/**
 * Current / upcoming fixtures from MySQL (not PulseLive).
 * Returns JSON shaped for the redesigned homepage.
 */
require_once __DIR__ . '/dbconnect.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $gwStmt = $pdo->query("
        SELECT gw_id, gw, status, event_is_cur, event_is_next, finished
        FROM fpl_hub_gw_data
        ORDER BY
          CASE WHEN event_is_cur = 1 THEN 0 WHEN event_is_next = 1 THEN 1 ELSE 2 END,
          gw_id ASC
        LIMIT 1
    ");
    $gw = $gwStmt->fetch(PDO::FETCH_ASSOC);

    $eventId = $gw ? (int)$gw['gw_id'] : null;

    if ($eventId) {
        $stmt = $pdo->prepare("
            SELECT fixture_id, team_name, opp_team, team_id, opp_team_id, ground,
                   status, team_score, opp_score, result, kickoff_time, gameweek, fdr
            FROM fpl_hub_fixture_data
            WHERE ground = 'home'
              AND gameweek = :gw
            ORDER BY kickoff_time IS NULL, kickoff_time ASC, fixture_id ASC
        ");
        $stmt->execute(['gw' => $eventId]);
    } else {
        $stmt = $pdo->query("
            SELECT fixture_id, team_name, opp_team, team_id, opp_team_id, ground,
                   status, team_score, opp_score, result, kickoff_time, gameweek, fdr
            FROM fpl_hub_fixture_data
            WHERE ground = 'home'
              AND (status != 'Done' OR kickoff_time >= NOW() - INTERVAL 1 DAY)
            ORDER BY kickoff_time IS NULL, kickoff_time ASC
            LIMIT 12
        ");
    }

    $fixtures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'gameweek' => $gw ? [
            'id' => (int)$gw['gw_id'],
            'name' => $gw['gw'],
            'status' => $gw['status'],
        ] : null,
        'fixtures' => $fixtures,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

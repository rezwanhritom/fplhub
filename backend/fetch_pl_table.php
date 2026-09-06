<?php
/**
 * Premier League table derived from finished fixtures in MySQL.
 */
require_once __DIR__ . '/dbconnect.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $stmt = $pdo->query("
        SELECT
            t.team_id,
            t.team_name,
            t.short_form,
            COALESCE(SUM(CASE WHEN f.status = 'Done' THEN 1 ELSE 0 END), 0) AS played,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.result = 'Win' THEN 1 ELSE 0 END), 0) AS won,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.result = 'Draw' THEN 1 ELSE 0 END), 0) AS drawn,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.result = 'Loss' THEN 1 ELSE 0 END), 0) AS lost,
            COALESCE(SUM(CASE WHEN f.status = 'Done' THEN f.team_score ELSE 0 END), 0) AS goals_for,
            COALESCE(SUM(CASE WHEN f.status = 'Done' THEN f.opp_score ELSE 0 END), 0) AS goals_against,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'home' THEN 1 ELSE 0 END), 0) AS home_played,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'home' AND f.result = 'Win' THEN 1 ELSE 0 END), 0) AS home_won,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'home' AND f.result = 'Draw' THEN 1 ELSE 0 END), 0) AS home_drawn,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'home' AND f.result = 'Loss' THEN 1 ELSE 0 END), 0) AS home_lost,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'home' THEN f.team_score ELSE 0 END), 0) AS home_gf,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'home' THEN f.opp_score ELSE 0 END), 0) AS home_ga,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'away' THEN 1 ELSE 0 END), 0) AS away_played,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'away' AND f.result = 'Win' THEN 1 ELSE 0 END), 0) AS away_won,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'away' AND f.result = 'Draw' THEN 1 ELSE 0 END), 0) AS away_drawn,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'away' AND f.result = 'Loss' THEN 1 ELSE 0 END), 0) AS away_lost,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'away' THEN f.team_score ELSE 0 END), 0) AS away_gf,
            COALESCE(SUM(CASE WHEN f.status = 'Done' AND f.ground = 'away' THEN f.opp_score ELSE 0 END), 0) AS away_ga
        FROM fpl_hub_team_data t
        LEFT JOIN fpl_hub_fixture_data f ON f.team_id = t.team_id
        GROUP BY t.team_id, t.team_name, t.short_form
    ");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $table = [];

    foreach ($rows as $r) {
        $gd = (int)$r['goals_for'] - (int)$r['goals_against'];
        $points = ((int)$r['won'] * 3) + (int)$r['drawn'];
        $table[] = [
            'team_id' => (int)$r['team_id'],
            'team_name' => $r['team_name'],
            'short_form' => $r['short_form'],
            'played' => (int)$r['played'],
            'won' => (int)$r['won'],
            'drawn' => (int)$r['drawn'],
            'lost' => (int)$r['lost'],
            'goals_for' => (int)$r['goals_for'],
            'goals_against' => (int)$r['goals_against'],
            'goal_diff' => $gd,
            'points' => $points,
            'home' => [
                'played' => (int)$r['home_played'],
                'won' => (int)$r['home_won'],
                'drawn' => (int)$r['home_drawn'],
                'lost' => (int)$r['home_lost'],
                'goals_for' => (int)$r['home_gf'],
                'goals_against' => (int)$r['home_ga'],
                'goal_diff' => (int)$r['home_gf'] - (int)$r['home_ga'],
                'points' => ((int)$r['home_won'] * 3) + (int)$r['home_drawn'],
            ],
            'away' => [
                'played' => (int)$r['away_played'],
                'won' => (int)$r['away_won'],
                'drawn' => (int)$r['away_drawn'],
                'lost' => (int)$r['away_lost'],
                'goals_for' => (int)$r['away_gf'],
                'goals_against' => (int)$r['away_ga'],
                'goal_diff' => (int)$r['away_gf'] - (int)$r['away_ga'],
                'points' => ((int)$r['away_won'] * 3) + (int)$r['away_drawn'],
            ],
        ];
    }

    usort($table, function ($a, $b) {
        return [$b['points'], $b['goal_diff'], $b['goals_for']]
            <=> [$a['points'], $a['goal_diff'], $a['goals_for']];
    });

    foreach ($table as $i => &$row) {
        $row['position'] = $i + 1;
    }

    echo json_encode(['success' => true, 'table' => $table]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

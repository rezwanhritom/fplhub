<?php
session_start();
require_once 'dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['logged_in'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

$allowedStats = [
    'points', 'price', 'form', 'selected_by_percent', 'minutes', 'goals', 'assists',
    'cs', 'saves', 'ppg', 'influence', 'creativity', 'threat', 'ict_index',
    'xg_per_90', 'xa_per_90', 'xgi_per_90'
];

try {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $fixtureType = $data['fixtureType'] ?? 'fdr';
    $nextGames = max(1, (int)($data['nextGames'] ?? 1));
    $playerStat = $data['playerStat'] ?? 'points';
    if (!in_array($playerStat, $allowedStats, true)) {
        $playerStat = 'points';
    }

    $stmt = $pdo->query("
        SELECT MAX(gameweek) as last_gw
        FROM fpl_hub_fixture_data
        WHERE status = 'Done'
    ");
    $lastGW = (int)($stmt->fetch(PDO::FETCH_ASSOC)['last_gw'] ?? 0);
    $nextGW = $lastGW > 0 ? $lastGW + 1 : 1;

    $playersStmt = $pdo->query("
        SELECT p.*, t.team_name AS joined_team_name
        FROM fpl_hub_player_data p
        JOIN fpl_hub_team_data t ON p.team_id = t.team_id
        ORDER BY p.web_name ASC
    ");
    $players = $playersStmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($players as $player) {
        $fixturesStmt = $pdo->prepare("
            SELECT f.*, t.strength_home, t.strength_away, t.strength_home_att,
                   t.strength_away_att, t.strength_home_def, t.strength_away_def
            FROM fpl_hub_fixture_data f
            JOIN fpl_hub_team_data t ON f.opp_team_id = t.team_id
            WHERE f.team_id = :team_id
              AND f.gameweek BETWEEN :next_gw AND :future_gw
              AND f.status != 'Done'
            ORDER BY f.gameweek ASC
        ");
        $fixturesStmt->execute([
            'team_id' => $player['team_id'],
            'next_gw' => $nextGW,
            'future_gw' => $nextGW + $nextGames - 1
        ]);
        $fixtures = $fixturesStmt->fetchAll(PDO::FETCH_ASSOC);

        $fixtureRating = 0;
        $fixtureDetails = [];

        foreach ($fixtures as $fixture) {
            $ground = strtolower((string)$fixture['ground']);
            switch ($fixtureType) {
                case 'strength_home':
                    $fixtureRating += $ground === 'home' ? (float)$fixture['strength_home'] : (float)$fixture['strength_away'];
                    break;
                case 'strength_away':
                    $fixtureRating += $ground === 'away' ? (float)$fixture['strength_away'] : (float)$fixture['strength_home'];
                    break;
                case 'strength_home_att':
                    $fixtureRating += $ground === 'home' ? (float)$fixture['strength_home_att'] : (float)$fixture['strength_away_att'];
                    break;
                case 'strength_away_att':
                    $fixtureRating += $ground === 'away' ? (float)$fixture['strength_away_att'] : (float)$fixture['strength_home_att'];
                    break;
                case 'strength_home_def':
                    $fixtureRating += $ground === 'home' ? (float)$fixture['strength_home_def'] : (float)$fixture['strength_away_def'];
                    break;
                case 'strength_away_def':
                    $fixtureRating += $ground === 'away' ? (float)$fixture['strength_away_def'] : (float)$fixture['strength_home_def'];
                    break;
                case 'fdr':
                default:
                    $fixtureRating += (float)$fixture['fdr'];
                    break;
            }

            $fixtureDetails[] = [
                'opp_team' => $fixture['opp_team'],
                'ground' => $ground
            ];
        }

        $fixtureRating = count($fixtures) > 0 ? $fixtureRating / count($fixtures) : 0;

        $result[] = [
            'web_name' => $player['web_name'],
            'team_name' => $player['joined_team_name'] ?: $player['team_name'],
            'fixture_rating' => $fixtureRating,
            'fixtures' => $fixtureDetails,
            'stat_value' => $player[$playerStat]
        ];
    }

    usort($result, function ($a, $b) use ($fixtureType) {
        $statCompare = $b['stat_value'] <=> $a['stat_value'];
        if ($statCompare === 0) {
            return $fixtureType === 'fdr'
                ? $a['fixture_rating'] <=> $b['fixture_rating']
                : $b['fixture_rating'] <=> $a['fixture_rating'];
        }
        return $statCompare;
    });

    echo json_encode([
        'success' => true,
        'players' => $result
    ]);
} catch (Exception $e) {
    error_log('Error in bestplayer.php: ' . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}

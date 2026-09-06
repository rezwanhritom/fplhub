<?php
session_start();
require_once 'dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['logged_in'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $sortBy = $data['sortBy'] ?? 'fdr';
    $nextGames = max(1, (int)($data['nextGames'] ?? 1));

    $stmt = $pdo->query("
        SELECT MAX(gameweek) as last_gw
        FROM fpl_hub_fixture_data
        WHERE status = 'Done'
    ");
    $lastGW = (int)($stmt->fetch(PDO::FETCH_ASSOC)['last_gw'] ?? 0);
    $nextGW = $lastGW > 0 ? $lastGW + 1 : 1;

    $teamsStmt = $pdo->query('SELECT * FROM fpl_hub_team_data');
    $allTeams = $teamsStmt->fetchAll(PDO::FETCH_ASSOC);
    $teams = [];

    foreach ($allTeams as $team) {
        $fixturesStmt = $pdo->prepare("
            SELECT f.gameweek, f.opp_team, f.ground, f.fdr, f.opp_team_id,
                   o.strength_home, o.strength_away, o.strength_home_att,
                   o.strength_away_att, o.strength_home_def, o.strength_away_def
            FROM fpl_hub_fixture_data f
            JOIN fpl_hub_team_data o ON f.opp_team_id = o.team_id
            WHERE f.team_id = :team_id
              AND f.gameweek BETWEEN :next_gw AND :future_gw
              AND f.status != 'Done'
            ORDER BY f.gameweek ASC
        ");
        $fixturesStmt->execute([
            'team_id' => $team['team_id'],
            'next_gw' => $nextGW,
            'future_gw' => $nextGW + $nextGames - 1
        ]);
        $fixtures = $fixturesStmt->fetchAll(PDO::FETCH_ASSOC);

        $rating = 0;
        $fixtureDetails = [];

        foreach ($fixtures as $fixture) {
            $ground = strtolower((string)$fixture['ground']);
            switch ($sortBy) {
                case 'strength_home':
                    $rating += $ground === 'home' ? (float)$fixture['strength_home'] : (float)$fixture['strength_away'];
                    break;
                case 'strength_away':
                    $rating += $ground === 'away' ? (float)$fixture['strength_away'] : (float)$fixture['strength_home'];
                    break;
                case 'strength_home_att':
                    $rating += $ground === 'home' ? (float)$fixture['strength_home_att'] : (float)$fixture['strength_away_att'];
                    break;
                case 'strength_away_att':
                    $rating += $ground === 'away' ? (float)$fixture['strength_away_att'] : (float)$fixture['strength_home_att'];
                    break;
                case 'strength_home_def':
                    $rating += $ground === 'home' ? (float)$fixture['strength_home_def'] : (float)$fixture['strength_away_def'];
                    break;
                case 'strength_away_def':
                    $rating += $ground === 'away' ? (float)$fixture['strength_away_def'] : (float)$fixture['strength_home_def'];
                    break;
                case 'fdr':
                default:
                    $rating += (float)$fixture['fdr'];
                    break;
            }

            $fixtureDetails[] = [
                'opp_team' => $fixture['opp_team'],
                'ground' => $ground
            ];
        }

        $teams[] = [
            'team_name' => $team['team_name'],
            'rating' => count($fixtures) > 0 ? $rating / count($fixtures) : 0,
            'fixtures' => $fixtureDetails
        ];
    }

    if ($sortBy === 'fdr') {
        usort($teams, function ($a, $b) {
            return $a['rating'] <=> $b['rating'];
        });
    } else {
        usort($teams, function ($a, $b) {
            return $b['rating'] <=> $a['rating'];
        });
    }

    echo json_encode([
        'success' => true,
        'teams' => $teams
    ]);
} catch (Exception $e) {
    error_log('Error in bestteam.php: ' . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}

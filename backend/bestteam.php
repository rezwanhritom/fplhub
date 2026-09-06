<?php
session_start();
require_once 'dbconnect.php';

// Remove any output before JSON
ob_clean();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $sortBy = $data['sortBy'] ?? 'fdr';
    $nextGames = (int)($data['nextGames'] ?? 1);

    // Get the latest completed gameweek
    $stmt = $pdo->query("
        SELECT MAX(gameweek) as last_gw 
        FROM fpl_hub_fixture_data 
        WHERE status = 'Done'
    ");
    $lastGW = $stmt->fetch(PDO::FETCH_ASSOC)['last_gw'];
    $nextGW = $lastGW + 1;

    // Initialize teams array
    $teams = [];

    // Get all teams
    $teamsStmt = $pdo->query("SELECT * FROM fpl_hub_team_data");
    $allTeams = $teamsStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($allTeams as $team) {
        // Get upcoming fixtures
        $fixturesStmt = $pdo->prepare("
            SELECT gameweek, opp_team, ground, fdr 
            FROM fpl_hub_fixture_data 
            WHERE team_id = :team_id 
            AND gameweek BETWEEN :next_gw AND :future_gw 
            AND status != 'Done'
            ORDER BY gameweek ASC
        ");
        $fixturesStmt->execute([
            'team_id' => $team['team_id'],
            'next_gw' => $nextGW,
            'future_gw' => $nextGW + $nextGames - 1
        ]);
        $fixtures = $fixturesStmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate rating based on sort criteria
        $rating = 0;
        $fixtureDetails = [];

        foreach ($fixtures as $fixture) {
            // Get opponent team's strength
            $oppStmt = $pdo->prepare("
                SELECT * FROM fpl_hub_team_data 
                WHERE team_name = :team_name
            ");
            $oppStmt->execute(['team_name' => $fixture['opp_team']]);
            $oppTeam = $oppStmt->fetch(PDO::FETCH_ASSOC);

            switch ($sortBy) {
                case 'fdr':
                    $rating += $fixture['fdr'];
                    break;
                case 'strength_home':
                    $rating += $fixture['ground'] === 'home' ? $oppTeam['strength_home'] : $oppTeam['strength_away'];
                    break;
                case 'strength_away':
                    $rating += $fixture['ground'] === 'away' ? $oppTeam['strength_away'] : $oppTeam['strength_home'];
                    break;
                case 'strength_home_att':
                    $rating += $fixture['ground'] === 'home' ? $oppTeam['strength_home_att'] : $oppTeam['strength_away_att'];
                    break;
                case 'strength_away_att':
                    $rating += $fixture['ground'] === 'away' ? $oppTeam['strength_away_att'] : $oppTeam['strength_home_att'];
                    break;
                case 'strength_home_def':
                    $rating += $fixture['ground'] === 'home' ? $oppTeam['strength_home_def'] : $oppTeam['strength_away_def'];
                    break;
                case 'strength_away_def':
                    $rating += $fixture['ground'] === 'away' ? $oppTeam['strength_away_def'] : $oppTeam['strength_home_def'];
                    break;
                default:
                    $rating += $fixture['fdr'];
            }

            $fixtureDetails[] = [
                'opp_team' => $fixture['opp_team'],
                'ground' => $fixture['ground']
            ];
        }

        // Add team to array
        $teams[] = [
            'team_name' => $team['team_name'],
            'rating' => $rating / count($fixtures),
            'fixtures' => $fixtureDetails
        ];
    }

    // Sort teams
    if ($sortBy === 'fdr') {
        // Lower FDR is better
        usort($teams, function($a, $b) {
            return $a['rating'] <=> $b['rating'];
        });
    } else {
        // Higher strength is better
        usort($teams, function($a, $b) {
            return $b['rating'] <=> $a['rating'];
        });
    }

    echo json_encode([
        'success' => true,
        'teams' => $teams
    ]);

} catch (Exception $e) {
    error_log("Error in bestteam.php: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
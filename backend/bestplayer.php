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
    $fixtureType = $data['fixtureType'] ?? 'fdr';
    $nextGames = (int)($data['nextGames'] ?? 1);
    $playerStat = $data['playerStat'] ?? 'points';

    // Get the latest completed gameweek
    $stmt = $pdo->query("
        SELECT MAX(gameweek) as last_gw 
        FROM fpl_hub_fixture_data 
        WHERE status = 'Done'
    ");
    $lastGW = $stmt->fetch(PDO::FETCH_ASSOC)['last_gw'];
    $nextGW = $lastGW + 1;

    // Get all players with their stats
    $playersStmt = $pdo->prepare("
        SELECT p.*, t.team_name 
        FROM fpl_hub_player_data p
        JOIN fpl_hub_team_data t ON p.team_id = t.team_id
        ORDER BY CAST(p.$playerStat AS DECIMAL(10,2)) DESC, p.web_name ASC
    ");
    $playersStmt->execute();
    $players = $playersStmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($players as $player) {
        // Get team's upcoming fixtures
        $fixturesStmt = $pdo->prepare("
            SELECT f.*, t.* 
            FROM fpl_hub_fixture_data f
            JOIN fpl_hub_team_data t ON f.opp_team = t.team_name
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

        // Calculate fixture rating
        $fixtureRating = 0;
        $fixtureDetails = [];
        
        foreach ($fixtures as $fixture) {
            switch ($fixtureType) {
                case 'fdr':
                    $fixtureRating += $fixture['fdr'];
                    break;
                case 'strength_home':
                    $fixtureRating += $fixture['ground'] === 'home' ? $fixture['strength_home'] : $fixture['strength_away'];
                    break;
                case 'strength_away':
                    $fixtureRating += $fixture['ground'] === 'away' ? $fixture['strength_away'] : $fixture['strength_home'];
                    break;
                case 'strength_home_att':
                    $fixtureRating += $fixture['ground'] === 'home' ? $fixture['strength_home_att'] : $fixture['strength_away_att'];
                    break;
                case 'strength_away_att':
                    $fixtureRating += $fixture['ground'] === 'away' ? $fixture['strength_away_att'] : $fixture['strength_home_att'];
                    break;
                case 'strength_home_def':
                    $fixtureRating += $fixture['ground'] === 'home' ? $fixture['strength_home_def'] : $fixture['strength_away_def'];
                    break;
                case 'strength_away_def':
                    $fixtureRating += $fixture['ground'] === 'away' ? $fixture['strength_away_def'] : $fixture['strength_home_def'];
                    break;
                default:
                    $fixtureRating += $fixture['fdr'];
            }

            $fixtureDetails[] = [
                'opp_team' => $fixture['opp_team'],
                'ground' => $fixture['ground']
            ];
        }

        $fixtureRating = count($fixtures) > 0 ? $fixtureRating / count($fixtures) : 0;

        // Add player to result array
        $result[] = [
            'web_name' => $player['web_name'],
            'team_name' => $player['team_name'],
            'fixture_rating' => $fixtureRating,
            'fixtures' => $fixtureDetails,
            'stat_value' => $player[$playerStat]
        ];
    }

    // Sort players by stat value (descending) and then by fixture rating
    usort($result, function($a, $b) use ($fixtureType) {
        $statCompare = $b['stat_value'] <=> $a['stat_value'];
        if ($statCompare === 0) {
            // For FDR, lower is better; for strength metrics, higher is better
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
    error_log("Error in bestplayer.php: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
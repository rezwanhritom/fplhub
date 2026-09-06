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
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'teams':
            // Get unique teams
            $stmt = $pdo->prepare("
                SELECT DISTINCT team_name, team_id 
                FROM fpl_hub_team_data 
                ORDER BY team_name ASC
            ");
            $stmt->execute();
            $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'teams' => $teams]);
            break;

        case 'search':
            $query = $_GET['query'] ?? '';
            $stmt = $pdo->prepare("
                SELECT DISTINCT team_name, team_id 
                FROM fpl_hub_team_data 
                WHERE team_name LIKE :query 
                ORDER BY team_name ASC
            ");
            $stmt->execute(['query' => "%$query%"]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'stats':
            $teamId = $_GET['team_id'] ?? '';
            if (!$teamId) {
                throw new Exception('Team ID required');
            }

            // Get team strength stats
            $strengthStmt = $pdo->prepare("
                SELECT * FROM fpl_hub_team_data 
                WHERE team_id = :team_id
            ");
            $strengthStmt->execute(['team_id' => $teamId]);
            $strength = $strengthStmt->fetch(PDO::FETCH_ASSOC);

            // Get match statistics
            $matchStmt = $pdo->prepare("
                SELECT 
                    SUM(CASE WHEN status = 'Done' THEN team_score ELSE 0 END) as goals_scored,
                    SUM(CASE WHEN status = 'Done' THEN opp_score ELSE 0 END) as goals_conceded,
                    SUM(CASE WHEN status = 'Done' AND result = 'Win' THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN status = 'Done' AND result = 'Draw' THEN 1 ELSE 0 END) as draws,
                    SUM(CASE WHEN status = 'Done' AND result = 'Loss' THEN 1 ELSE 0 END) as losses,
                    SUM(CASE WHEN status = 'Done' AND ground = 'home' THEN team_score ELSE 0 END) as home_goals_scored,
                    SUM(CASE WHEN status = 'Done' AND ground = 'away' THEN team_score ELSE 0 END) as away_goals_scored,
                    SUM(CASE WHEN status = 'Done' AND ground = 'home' THEN opp_score ELSE 0 END) as home_goals_conceded,
                    SUM(CASE WHEN status = 'Done' AND ground = 'away' THEN opp_score ELSE 0 END) as away_goals_conceded,
                    SUM(CASE WHEN status = 'Done' AND ground = 'home' AND result = 'Win' THEN 1 ELSE 0 END) as home_wins,
                    SUM(CASE WHEN status = 'Done' AND ground = 'home' AND result = 'Draw' THEN 1 ELSE 0 END) as home_draws,
                    SUM(CASE WHEN status = 'Done' AND ground = 'home' AND result = 'Loss' THEN 1 ELSE 0 END) as home_losses,
                    SUM(CASE WHEN status = 'Done' AND ground = 'away' AND result = 'Win' THEN 1 ELSE 0 END) as away_wins,
                    SUM(CASE WHEN status = 'Done' AND ground = 'away' AND result = 'Draw' THEN 1 ELSE 0 END) as away_draws,
                    SUM(CASE WHEN status = 'Done' AND ground = 'away' AND result = 'Loss' THEN 1 ELSE 0 END) as away_losses
                FROM fpl_hub_fixture_data 
                WHERE team_id = :team_id
            ");
            $matchStmt->execute(['team_id' => $teamId]);
            $matches = $matchStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'strength' => $strength,
                'matches' => $matches
            ]);
            break;

        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    error_log("Error in tvst.php: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
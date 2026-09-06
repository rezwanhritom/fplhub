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
        case 'players':
            $stmt = $pdo->prepare("
                SELECT player_id, web_name, points 
                FROM fpl_hub_player_data 
                ORDER BY CAST(points AS DECIMAL(10,2)) DESC, web_name ASC
                LIMIT 100
            ");
            $stmt->execute();
            $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'players' => $players]);
            break;

        case 'search':
            // Search players by name
            $query = $_GET['query'] ?? '';
            $stmt = $pdo->prepare("
                SELECT player_id, web_name, points 
                FROM fpl_hub_player_data 
                WHERE web_name LIKE :query 
                ORDER BY CAST(points AS DECIMAL(10,2)) DESC, web_name ASC
            ");
            $stmt->execute(['query' => "%$query%"]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'stats':
            // Get detailed player stats
            $playerId = $_GET['player_id'] ?? '';
            if (!$playerId) {
                throw new Exception('Player ID required');
            }

            $stmt = $pdo->prepare("
                SELECT * FROM fpl_hub_player_data 
                WHERE player_id = :player_id
            ");
            $stmt->execute(['player_id' => $playerId]);
            $player = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$player) {
                throw new Exception('Player not found');
            }

            echo json_encode($player);
            break;

        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    error_log("Error in pvsp.php: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
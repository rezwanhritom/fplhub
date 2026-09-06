<?php
session_start();
require_once 'dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['logged_in'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $position = $data['position'] ?? 'ALL';
    $team = $data['team'] ?? 'ALL';
    $stat = $data['stat'] ?? 'points';

    // Debug logging
    error_log("Received filters - Position: $position, Team: $team, Stat: $stat");

    $query = "SELECT web_name, status, news, $stat as stat_value 
              FROM fpl_hub_player_data 
              WHERE 1=1";

    if ($position !== 'ALL') {
        $query .= " AND pos = :position";
    }
    if ($team !== 'ALL') {
        $query .= " AND team_name = :team";
    }

    $query .= " ORDER BY CAST(stat_value AS DECIMAL(10,2)) DESC, web_name ASC";

    $stmt = $pdo->prepare($query);
    
    if ($position !== 'ALL') {
        $stmt->bindParam(':position', $position);
    }
    if ($team !== 'ALL') {
        $stmt->bindParam(':team', $team);
    }

    $stmt->execute();
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Debug logging
    error_log("Query result count: " . count($players));
    error_log("First player data: " . print_r($players[0] ?? [], true));

    echo json_encode(['success' => true, 'players' => $players]);

} catch (Exception $e) {
    error_log("Error in stats.php: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
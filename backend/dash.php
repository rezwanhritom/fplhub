<?php
ob_start();
session_start();
require_once 'dbconnect.php';
ob_clean();
header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    exit(json_encode(['error' => 'Not authenticated']));
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'get_team':
        $stmt = $pdo->prepare("SELECT ut.position, ut.player_id, p.web_name, p.price as now_cost, p.points 
                              FROM user_team ut 
                              JOIN fpl_hub_player_data p ON ut.player_id = p.player_id 
                              WHERE ut.user_id = ?");
        $stmt->execute([$_SESSION['id']]);
        $team = [
            'GKP' => [],
            'DEF' => [],
            'MID' => [],
            'FOR' => []
        ];
        
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $position = $row['position'];
            unset($row['position']);
            $team[$position][] = $row;
        }
    
        $stmt = $pdo->prepare("SELECT fantasy_team FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'team' => $team,
            'fantasy_team' => $user['fantasy_team']
        ]);
        break;
        case 'get_players':
            $position = $_GET['position'] ?? '';
            $search = $_GET['search'] ?? '';
            
            // Log incoming request
            error_log("Position: $position, Search: $search");
            
            $query = "SELECT player_id, web_name as web_name, price as now_cost, 
                     pos, selected_by_percent, points 
                     FROM fpl_hub_player_data 
                     WHERE pos = :position";
            
            if ($search) {
                $query .= " AND web_name LIKE :search";
            }
            $query .= " ORDER BY selected_by_percent DESC, web_name ASC";
            
            try {
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':position', $position);
                if ($search) {
                    $searchTerm = "%$search%";
                    $stmt->bindParam(':search', $searchTerm);
                }
                
                // Log query
                error_log("Executing query: " . str_replace(":position", "'$position'", $query));
                
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Log results
                error_log("Found " . count($results) . " players");
                
                echo json_encode($results);
            } catch (PDOException $e) {
                error_log("Database error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
            break;
        }
?>

<?php
session_start();
require_once 'dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'error' => 'Not authenticated']));
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data)) {
        throw new Exception('Invalid or empty data received');
    }

    $pdo->beginTransaction();

    // Delete existing team
    $delete = $pdo->prepare("DELETE FROM user_team WHERE user_id = ?");
    $delete->execute([$_SESSION['id']]);
    
    // Insert new team
    $insert = $pdo->prepare("INSERT INTO user_team (user_id, player_id, position) VALUES (?, ?, ?)");
    
    foreach ($data as $slot) {
        if (isset($slot['player_id']) && isset($slot['position'])) {
            $insert->execute([
                $_SESSION['id'],
                $slot['player_id'],
                $slot['position']
            ]);
        }
    }
    
    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Save team error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
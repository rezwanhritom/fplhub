<?php
session_start();
require 'dbconnect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $fantasy_team = trim($_POST['fantasy_team']);

    if (!isset($_SESSION['google_id'])) {
        die("Error: Google authentication session expired. Please sign in again.");
    }

    $google_id = $_SESSION['google_id'];

    if (empty($username) || empty($fantasy_team)) {
        die("All fields are required.");
    }

    try {
        // First get the user ID
        $stmt = $pdo->prepare("SELECT id FROM users WHERE google_id = ?");
        $stmt->execute([$google_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception("User not found");
        }

        // Update user record
        $stmt = $pdo->prepare("UPDATE users SET username = ?, fantasy_team = ? WHERE google_id = ?");
        $stmt->execute([$username, $fantasy_team, $google_id]);

        if ($stmt->rowCount() > 0) {
            // Set correct session variables
            $_SESSION['id'] = $user['id'];
            $_SESSION['username'] = $username;
            $_SESSION['logged_in'] = true;
            $_SESSION['fantasy_team'] = $fantasy_team;

            // Debug log
            error_log("Session after update: " . print_r($_SESSION, true));

            // Redirect to dashboard
            header("Location: http://localhost/fpl_hub/frontend/dash.html");
            exit();
        } else {
            throw new Exception("Failed to update user data");
        }
    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        header("Location: http://localhost/fpl_hub/backend/login.php?error=" . urlencode($e->getMessage()));
        exit();
    }
}
?>
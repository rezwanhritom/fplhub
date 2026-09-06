<?php
require 'dbconnect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);

    try {
        // Check if username already exists in the database
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmt->execute([$username]);

        if ($stmt->fetchColumn() > 0) {
            echo "taken"; // Only echo 'taken'
        } else {
            echo "available"; // Only echo 'available'
        }
    } catch (PDOException $e) {
        // If there is any database issue, return an error message
        echo "Error checking username availability: " . $e->getMessage();
    }
}
?>

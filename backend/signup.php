<?php
session_start();
require_once 'dbconnect.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $fullname = trim($_POST["fullname"]);
    $username = trim($_POST["username"]);
    $email = trim($_POST["email"]);
    $password = $_POST["password"];
    $fantasy_team = trim($_POST["fantasy_team"]);

    if (!$fullname || !$username || !$email || !$password || !$fantasy_team) {
        die("Error: All fields are required.");
    }

    try {
        // Check if username exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            die("Error: Username already exists.");
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $stmt = $pdo->prepare("INSERT INTO users (fullname, username, email, password, fantasy_team) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$fullname, $username, $email, $hashed_password, $fantasy_team]);
        
        // Get the new user's ID
        $userId = $pdo->lastInsertId();

        // Set session variables
        $_SESSION['id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['logged_in'] = true;
        $_SESSION['fantasy_team'] = $fantasy_team;

        // Debug log
        error_log("Session after signup: " . print_r($_SESSION, true));

        header("Location: http://localhost/fpl_hub/frontend/dash.html");
        exit();
    } catch (PDOException $e) {
        error_log("Signup error: " . $e->getMessage());
        die("Error: Registration failed. Please try again.");
    }
} else {
    die("Error: Invalid request method.");
}
?>
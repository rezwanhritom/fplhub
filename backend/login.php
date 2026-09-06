<?php
session_start();
require_once 'dbconnect.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = trim($_POST["username"] ?? '');
    $password = $_POST["password"] ?? '';

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(["success" => false, "errorType" => "username"]);
            exit();
        }

        if ($user['google_id'] && !$user['password']) {
            echo json_encode(["success" => false, "errorType" => "google_user"]);
            exit();
        }

        if (!password_verify($password, $user['password'])) {
            echo json_encode(["success" => false, "errorType" => "password"]);
            exit();
        }

        $_SESSION['id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['logged_in'] = true;
        $_SESSION['fantasy_team'] = $user['fantasy_team'];

        echo json_encode(["success" => true]);
        exit();

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error"]);
        exit();
    }
}
?>
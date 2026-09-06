<?php
require_once __DIR__ . '/google_config.php';
require_once __DIR__ . '/dbconnect.php';

session_start();

if (isset($_GET['code'])) {
    $google_client->authenticate($_GET['code']);
    $access_token = $google_client->getAccessToken();
    $google_client->setAccessToken($access_token);

    $google_service = new Google_Service_Oauth2($google_client);
    $user_info = $google_service->userinfo->get();

    $email = $user_info->email;
    $fullname = $user_info->givenName . " " . $user_info->familyName;
    $google_id = $user_info->id;

    try {
        if (!isset($pdo) || !$pdo instanceof PDO) {
            throw new Exception("Database connection error.");
        }

        $stmt = $pdo->prepare("SELECT id, username, fantasy_team FROM users WHERE google_id = ?");
        $stmt->execute([$google_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            if (!empty($user['username']) && !empty($user['fantasy_team'])) {
                $_SESSION['id'] = $user['id'];
                $_SESSION['google_id'] = $google_id;
                $_SESSION['email'] = $email;
                $_SESSION['fullname'] = $fullname;
                $_SESSION['logged_in'] = true;
                $_SESSION['username'] = $user['username'];
                $_SESSION['fantasy_team'] = $user['fantasy_team'];

                header("Location: http://localhost/fpl_hub/frontend/dash.html");
                exit();
            }

            $_SESSION['google_id'] = $google_id;
            $_SESSION['email'] = $email;
            $_SESSION['fullname'] = $fullname;

            header("Location: http://localhost/fpl_hub/frontend/google_signup.html");
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO users (google_id, email, fullname, username, fantasy_team) VALUES (?, ?, ?, NULL, NULL)");
        $stmt->execute([$google_id, $email, $fullname]);

        $_SESSION['google_id'] = $google_id;
        $_SESSION['email'] = $email;
        $_SESSION['fullname'] = $fullname;

        header("Location: http://localhost/fpl_hub/frontend/google_signup.html");
        exit();
    } catch (PDOException $e) {
        echo "Database error: " . $e->getMessage();
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage();
    }
} else {
    echo "Error: Google authentication failed.";
}

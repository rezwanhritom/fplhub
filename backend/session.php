<?php
session_start();

function isLoggedIn() {
    return isset($_SESSION['id']) && $_SESSION['logged_in'] === true;
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: http://localhost/fpl_hub/login.php');
        exit();
    }
}
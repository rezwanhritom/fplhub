<?php
require 'google_config.php';

$google_login_url = $google_client->createAuthUrl(); // Generate Google login URL
header("Location: $google_login_url");
exit();
?>

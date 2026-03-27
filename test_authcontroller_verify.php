<?php
require_once 'vendor/autoload.php';
require_once 'app/controller/authController.php';

$controller = new App\Controller\AuthController();
ob_start();
$controller->verify(['username' => 'edu', 'password' => 'edu']);
$output = ob_get_clean();

echo "Direct AuthController verify output: $output\n";
?>
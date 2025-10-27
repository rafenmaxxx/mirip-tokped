<?php
header('Content-Type: application/json');

$route = $_GET['route'] ?? '';

// pasangin auth
session_start();
switch ($route) {
    case 'product':
        require_once __DIR__ . '/controller/c_product.php';
        break;
    case 'image':
        require_once __DIR__ . '/controller/c_image.php';
        break;
    case 'user':
        require_once __DIR__ . '/controller/c_user.php';
        break;
    case 'path':
        require_once __DIR__ . '/controller/c_path.php';
        break;
    case 'login':
        require_once __DIR__ . '/controller/c_login.php';
    case 'logout':
        require_once __DIR__ . '/controller/c_logout.php';
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Route tidak ditemukan']);
        break;
}

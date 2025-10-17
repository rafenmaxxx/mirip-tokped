<?php
header('Content-Type: application/json');

$route = $_GET['route'] ?? '';

switch ($route) {
    case 'product':
        require_once __DIR__ . '/controller/c_product.php';
        break;
    case 'image':
        require_once __DIR__ . '/controller/c_image.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Route tidak ditemukan']);
        break;
}

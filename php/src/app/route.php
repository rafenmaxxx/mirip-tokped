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
    case 'seller':
        require_once __DIR__ . '/controller/c_seller.php';
        break;
    case 'login':
        require_once __DIR__ . '/controller/c_login.php';
        break;
    case 'logout':
        require_once __DIR__ . '/controller/c_logout.php';
        break;
    case 'auth':
        require_once __DIR__ . '/controller/c_auth.php';
        break;
    case 'detail_store':
        require_once __DIR__ . '/controller/c_store.php';
        break;
    case 'topup':
        require_once __DIR__ . '/controller/c_topup.php';
        break;
    case 'cart':
        require_once __DIR__ . '/controller/c_cart.php';
        break;
    case 'checkout':
        require_once __DIR__ . '/controller/c_checkout.php';
        break;
    case 'profile':
        require_once __DIR__ . '/controller/c_user.php';
        break;
    case 'order':
        require_once __DIR__ . '/controller/c_order.php';
        break;
    case 'category':
        require_once __DIR__ . '/controller/c_category.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Route tidak ditemukan']);
        break;
}

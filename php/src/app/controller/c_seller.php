<?php
require_once __DIR__ . '/../model/m_seller.php';

$model = new Seller();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

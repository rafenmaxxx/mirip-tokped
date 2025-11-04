<?php
require_once __DIR__ . '/../model/m_category.php';

$model = new Category();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $product_id = $_GET['product_id'] ?? null;
        if ($product_id) {
            $data = $model->getCategoriesForProduct($product_id);
        } else {
            $data = $model->getAll();
        }
        echo json_encode(['status' => 'success', 'data' => $data]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

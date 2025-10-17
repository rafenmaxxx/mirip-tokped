<?php
require_once __DIR__ . '/../model/m_product.php';

$model = new Product();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;

        if ($id) {
            // Jika ada parameter id
            $data = $model->getById($id);
        } else {
            // Jika tidak ada parameter id
            $data = $model->getAll();
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

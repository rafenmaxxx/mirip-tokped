<?php
require_once __DIR__ . '/../model/m_product.php';

$model = new Product();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $search = $_GET['search'] ?? null;
        $id = $_GET['id'] ?? null;
        
       
        if ($search) {
            // Jika ada parameter search
            $data = $model->getByName($search);
        } else if ($id) {
            // ada id
            $data = $model->getDetailById($id);
        } else {
            // Jika tidak ada parameter
            $data = $model->getAll();
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}
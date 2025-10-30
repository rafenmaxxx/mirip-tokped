<?php
require_once __DIR__ . '/../model/m_store.php';
require_once __DIR__ . '/../model/m_product.php';

$model = new Store();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $store_id = $_GET['store_id'] ?? null;
        
        if ($store_id) {
            // Jika ada parameter store_id
            $data = $model->getByStoreId($store_id);
        } else {
            // Jika tidak ada parameter store_id
            $store_id = 1; // default store_id
            $data = $model->getByStoreId($store_id);
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}
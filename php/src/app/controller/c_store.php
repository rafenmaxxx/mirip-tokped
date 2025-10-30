<?php
require_once __DIR__ . '/../model/m_store.php';
require_once __DIR__ . '/../model/m_product.php';

$model = new Store();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $store_id = $_GET['store_id'] ?? null;

        if ($store_id) {
            $data = $model->getByStoreId($store_id);
        } else {
            if (!isset($_SESSION['user'])) {
                echo "<script>
                alert('Login dulu Bos !');
                window.location.href = '/login';
            </script>";
                exit;
            }
            $id = $_SESSION['user']['id'];

            $data = $model->getStoreByUserId($id);
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

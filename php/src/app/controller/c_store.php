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
    
    case 'PUT':
        parse_str(file_get_contents("php://input"), $putData);
        $store_id = $_SESSION['user']['store_id'] ?? null;
        $store_name = $putData['store_name'] ?? null;
        $store_description = $putData['store_description'] ?? null;
        $store_logo_path = $putData['store_logo_path'] ?? null;

        if ($store_id && $store_name && $store_description && $store_logo_path) {
            $result = $model->updateStoreWithLogo($store_id, $store_name, $store_description, $store_logo_path);
            echo json_encode(['status' => 'success', 'message' => 'Store updated successfully']);
        }

        if ($store_id && $store_name && $store_description) {
            $result = $model->updateStore($store_id, $store_name, $store_description);
            echo json_encode(['status' => 'success', 'message' => 'Store updated successfully']);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

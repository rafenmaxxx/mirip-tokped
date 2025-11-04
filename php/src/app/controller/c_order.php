<?php
require_once __DIR__ . '/../model/m_order.php';
require_once __DIR__ . '/../model/m_auth.php';
require_once __DIR__ . '/../model/m_sanitizer.php';

$model = new Order();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $action = $_GET['action'] ?? null;
        $id = $_GET['id'] ?? null;
        $user_id = $_SESSION['user']['id'] ?? null;
        $store_id = $_SESSION['user']['store_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $title = $_GET['title'] ?? null;
        $page = $_GET['page'] ?? null;
        $limit = $_GET['limit'] ?? null;


        if ($store_id && $status && $title) {
            guard(['SELLER']);
            $count = $model->countOrderByStoreAndStatusAndName($store_id, $status, $title);
            $data = $model->getOrderByStoreAndStatusAndName($store_id, $status, $title, $page, $limit);
        } else if ($store_id && $status) {
            guard(['SELLER']);
            $count = $model->countOrderByStoreAndStatus($store_id, $status);
            $data = $model->getOrderByStoreAndStatus($store_id, $status, $page, $limit);
        } else if ($store_id && $title) {
            guard(['SELLER']);
            $count = $model->countOrderByStoreAndName($store_id, $title);
            $data = $model->getOrderByStoreAndName($store_id, $title, $page, $limit);
        } else if ($store_id) {
            guard(['SELLER']);
            $count = $model->countOrderByStore($store_id);
            $data = $model->getOrderByStore($store_id, $page, $limit);
        } else if ($id) {
            guard(['BUYER', 'SELLER']);
            $data = $model->getById($id, $user_id);
        } else if ($user_id) {
            guard(['BUYER']);
            $data = $model->getByUserId($user_id);
        }

        echo json_encode(['status' => 'success', 'data' => $data, 'count' => $count ?? null]);
        break;

    case 'POST':
        guard(['BUYER']);
        $action = $_POST['action'] ?? null;

        switch ($action) {
            case 'create':
                $buyer_id = $_POST['buyer_id'] ?? null;
                $store_id = $_POST['store_id'] ?? null;
                $total_price = $_POST['total_price'] ?? null;
                $shipping_address = $_POST['shipping_address'] ?? null;
                $shipping_address = sanitizePlainText($shipping_address);
                $result = $model->createOrder($buyer_id, $store_id, $total_price, $shipping_address);
                echo json_encode(['status' => 'success', 'data' => $result]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
                break;
        }
        break;
    case 'PUT':
        guard(['BUYER', 'SELLER']);
        parse_str(file_get_contents("php://input"), $PUT);
        $action = $PUT['action'] ?? null;

        switch ($action) {
            case 'update_status':
                $id = $PUT['order_id'] ?? null;
                $status = $PUT['status'] ?? null;
                $msg = $PUT['msg'] ?? null;
                $durasi = $PUT['durasi'] ?? null;
                $msg = sanitizePlainText($msg);
                if ($id && $status) {
                    $result = $model->updateStatus($id, $status, $msg, $durasi);
                    if ($result > 0) {
                        http_response_code(200);
                        echo json_encode(['status' => 'success', 'data' => $result]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['status' => 'error', 'message' => 'Gagal update status']);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Order ID and status are required']);
                }
                break;

            default:
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
                break;
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $result = $model->deleteOrder($id);
            echo json_encode(['status' => 'success', 'data' => $result]);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Order ID is required']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

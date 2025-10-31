<?php
require_once __DIR__ . '/../model/m_order.php';

$model = new Order();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    
    case 'GET':
        $id = $_GET['id'] ?? null;
        $user_id = $_SESSION['user']['id'] ?? null;
        
        if ($id) {
            $data = $model->getById($id);
        } else if ($user_id) {
            $data = $model->getByUserId($user_id);
        } else {
            $data = $model->getAll();
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    case 'POST':
        $action = $_POST['action'] ?? null;
       
        switch ($action) {
            case 'create':
                $buyer_id = $_POST['buyer_id'] ?? null;
                $store_id = $_POST['store_id'] ?? null;
                $total_price = $_POST['total_price'] ?? null;
                $shipping_address = $_POST['shipping_address'] ?? null;

                $result = $model->createOrder($buyer_id, $store_id, $total_price, $shipping_address);
                
                echo json_encode(['status' => 'success', 'data' => $result]);
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
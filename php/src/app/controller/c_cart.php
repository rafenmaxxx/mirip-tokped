<?php
require_once __DIR__ . '/../model/m_cart.php';

$model = new Cart();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $buyer_id = $_GET['buyer_id'] ?? null;
        $store_id = $_GET['store_id'] ?? null;
        $action = $_GET['action'] ?? null;

        
        if ($id) {
            // ada id
            $data = $model->getById($id);
        } else if ($buyer_id && $store_id && !$action) {
            // ada buyer_id dan store_id (untuk refresh single store)
            $data = $model->getByStoreAndBuyer($buyer_id, $store_id);
        } else if ($buyer_id && $action === 'summary') {
            // ada buyer_id dan action=summary
            $data = $model->getTotal($buyer_id);
        } else if ($buyer_id) {
            // Jika ada parameter buyer_id
            $data = $model->getByBuyer($buyer_id);
        } else if ($action === 'delete' && $id) {
            // Jika ada parameter action=delete dan id
            $data = $model->removeFromCart($id);
        } else if ($action === 'delete' && $store_id && $buyer_id) {
            // Jika ada parameter action=delete dan store_id dan buyer_id
            $data = $model->removeStoreFromCart($buyer_id, $store_id);
        } else if ($action === 'clear' && $buyer_id) {
            // Jika ada parameter action=clear dan buyer_id
            $data = $model->clearBuyerCart($buyer_id);
        } else {
            // Jika tidak ada parameter
            $data = $model->getAll();
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    case 'POST':
        $action = $_POST['action'] ?? null;
        $buyer_id = $_POST['buyer_id'] ?? null;
        $product_id = $_POST['product_id'] ?? null;
       
        switch ($action) {
            case 'add':
                $buyer_id = $_POST['buyer_id'] ?? null;
                $product_id = $_POST['product_id'] ?? null;
                $quantity = $_POST['quantity'] ?? 1;

                if ($buyer_id && $product_id) {
                    $result = $model->addToCart($buyer_id, $product_id, 1);
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
                }
                break;

            case 'remove':
                $cart_item_id = $_POST['cart_item_id'] ?? null;

                if ($cart_item_id) {
                    $result = $model->removeFromCart($cart_item_id);
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
                }
                break;

            case 'clear':
                $buyer_id = $_POST['buyer_id'] ?? null;

                if ($buyer_id) {
                    $result = $model->clearBuyerCart($buyer_id);
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
                }
                break;

            default:
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
                break;
        }
        break;
    
    case 'PUT':
        parse_str(file_get_contents("php://input"), $_PUT);
        $cart_item_id = $_PUT['cart_item_id'] ?? null;
        $action = $_PUT['action'] ?? null;

        if ($action === 'increament' && $cart_item_id) {
            $success = $model->increamentQuantity($cart_item_id, 1);
            $store_id = $model->getStoreIdByCartItem($cart_item_id);
            $buyer_id = $model->getBuyerIdByCartItem($cart_item_id);
            
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'cart_item_id' => $cart_item_id,
                    'store_id' => $store_id,
                    'buyer_id' => $buyer_id,
                    'action' => 'increament'
                ]
            ]);
        } else if ($action === 'decreament' && $cart_item_id) {
            $success = $model->decreamentQuantity($cart_item_id, 1);
            $store_id = $model->getStoreIdByCartItem($cart_item_id);
            $buyer_id = $model->getBuyerIdByCartItem($cart_item_id);
            
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'cart_item_id' => $cart_item_id,
                    'store_id' => $store_id,
                    'buyer_id' => $buyer_id,
                    'action' => 'decreament'
                ]
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}
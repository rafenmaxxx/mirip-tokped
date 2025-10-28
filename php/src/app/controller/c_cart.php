<?php
require_once __DIR__ . '/../model/m_cart.php';

$model = new Cart();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $buyer_id = $_GET['buyer_id'] ?? null;
        $total = $_GET['total'] ?? false;

        if ($id) {
            // ada id
            $data = $model->getById($id);
        } else if ($buyer_id && $total) {
            // ada buyer_id dan total
            $data = $model->getTotal($buyer_id);
        } else if ($buyer_id) {
            // Jika ada parameter buyer_id
            $data = $model->getByBuyer($buyer_id);
        } else {
            // Jika tidak ada parameter
            $data = $model->getAll();
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    case 'POST':
        $action = $_POST['action'] ?? null;

        switch ($action) {
            case 'add':
                $buyer_id = $_POST['buyer_id'] ?? null;
                $product_id = $_POST['product_id'] ?? null;
                $quantity = $_POST['quantity'] ?? 1;

                if ($buyer_id && $product_id) {
                    $result = $model->addToCart($buyer_id, $product_id, $quantity);
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
    
    case 'PATCH':
        parse_str(file_get_contents("php://input"), $patchData);
        $cart_item_id = $patchData['cart_item_id'] ?? null;
        $quantity = $patchData['quantity'] ?? null;

        if ($cart_item_id && $quantity !== null) {
            $result = $model->updateQuantity($cart_item_id, $quantity);
            echo json_encode($result);
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
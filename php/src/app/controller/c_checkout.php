<?php
require_once __DIR__ . '/../model/m_cart.php';
require_once __DIR__ . '/../model/m_auth.php';


$model = new Cart();
$method = $_SERVER['REQUEST_METHOD'];

guard(['BUYER']);
switch ($method) {
    case 'POST':
        $buyer_id = $_SESSION['user']['id'] ?? null;
        $address = $_POST['address'] ?? null;
        if (!$address) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Shipping address wajib diisi'
            ]);
            exit;
        }

        $result = $model->checkout($buyer_id, $address);

        if ($result['status'] === 'success') {
            echo json_encode([
                'status' => 'success',
                'message' => $result['message'],
                'redirect' => $result['redirect']
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => $result['message']
            ]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

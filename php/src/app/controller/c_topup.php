<?php
require_once __DIR__ . '/../model/m_user.php';
require_once __DIR__ . '/../model/m_auth.php';
$model = new User();
$method = $_SERVER['REQUEST_METHOD'];



switch ($method) {
    case 'POST':
        guard(['BUYER']);
        $value = $_POST['value'];
        $id = $_SESSION['user']['id'];
        $data = $model->addBalance($id, $value);
        if ($data) {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'data' => $data]);
            break;
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'failed', 'data' => $data]);
            break;
        }

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

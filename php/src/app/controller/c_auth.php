<?php
require_once __DIR__ . '/../model/m_auth.php';

$model = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $result = $model->check();
        if ($result) {
            header('Content-Type: application/json');
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Check Success', 'data' => $result]);
        } else {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Check Gagal', 'data' => $result]);
        }

        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

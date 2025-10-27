<?php
require_once __DIR__ . '/../model/m_auth.php';

$model = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $result = $model->logout();
        header('Content-Type: application/json');
        echo json_encode($result);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

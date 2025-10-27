<?php
require_once __DIR__ . '/../model/m_path.php';
$method = $_SERVER['REQUEST_METHOD'];
$model = new Path();

switch ($method) {
    case 'GET':
        $route = urldecode($_GET['path'] ?? '');
        if ($route === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No route specified']);
            exit;
        }

        $data = $model->getPath($route);

        if ($data === null) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Route tidak ditemukan']);
        } else {
            echo json_encode(['status' => 'success', 'data' => $data]);
        }
        exit;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

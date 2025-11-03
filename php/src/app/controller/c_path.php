<?php
require_once __DIR__ . '/../model/m_path.php';



$method = $_SERVER['REQUEST_METHOD'];
$model = new Path();

$public_dir = __DIR__ . '/../../public';

switch ($method) {
    case 'GET':
        $route = urldecode($_GET['path'] ?? '');


        if (isset($_SESSION['user']) && $_SESSION['user']['role'] == 'SELLER') {
            if ($route == '/' || $route == '/home' || $route == '/#' || $route == '/home#') {
                $route = '/seller';
            }
        }

        if ($route === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No route specified']);
            exit;
        }

        $routeData = $model->getPath($route);

        if ($routeData === null) {
            http_response_code(200);
            echo json_encode(['status' => 'error', 'message' => 'Route tidak ditemukan']);
            exit;
        }

        $html_file_path = $public_dir . $routeData['html'];

        if (!file_exists($html_file_path)) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'File HTML tidak ditemukan di server']);
            exit;
        }

        $html_content = file_get_contents($html_file_path);



        unset($routeData['html']);

        http_response_code(200);
        header('Content-Type: application/json');

        echo json_encode([
            'status' => 'success',
            'data' => [
                'html_content' => $html_content,
                'metadata' => $routeData
            ]
        ]);
        exit;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

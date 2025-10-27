<?php
require_once __DIR__ . '/../model/m_auth.php';

$model = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $model->logout();
         header('Content-Type: text/html; charset=utf-8');
        echo "<script>
                alert('Berhasil Logout');
                window.location.href = '/';
            </script>";
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}
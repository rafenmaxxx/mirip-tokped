
<?php
require_once __DIR__ . '/../model/m_auth.php';

$model = new User();
$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user'])) {
    echo "<script>
                alert('Login dulu Bos !');
                window.location.href = '/login';
            </script>";
    exit;
}

switch ($method) {
    case 'POST':
        $value = $_POST['value'];
        $id = $_SESSION['user']['id'];
        $data = $model->addBalance($id, $value);
        if ($data) {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'TopUp Success', 'data' => $data]);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'failed', 'message' => 'TopUp Failed', 'data' => $data]);
        }

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

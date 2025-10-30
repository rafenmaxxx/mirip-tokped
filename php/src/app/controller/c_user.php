<?php

require_once __DIR__ . '/../model/m_user.php';

$model = new User();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? null;
        switch ($action):
            case 'balance':
                if (!isset($_SESSION['user'])) {
                    echo "<script>
                        alert('Login dulu Bos !');
                        window.location.href = '/login';
                    </script>";
                    exit;
                }

                $id = $_SESSION['user']['id'];
                $res = $model->getBalance($id);

                header('Content-Type: application/json');
                if ($res) {
                    http_response_code(200);
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Get Balance Success',
                        'data' => $res
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'failed',
                        'message' => 'Get Balance Failed',
                        'data' => $res
                    ]);
                }
                break;

            default:
                http_response_code(405);
                echo json_encode(['status' => 'error', 'message' => 'Action not allowed']);
                break;
        endswitch;
        break;

    case 'POST':
        header('Content-Type: text/html; charset=utf-8');
        $email = $_POST['email'] ?? null;
        $name = $_POST['name'] ?? null;
        $address = $_POST['address'] ?? null;
        $password = $_POST['password'] ?? null;
        $role = $_POST['role'] ?? null;

        $data = $model->createUser($name, $email, $password, $address, $role, 0);
        if ($data) {
            echo "<script>
                alert('Berhasil mendaftarkan $email!');
                window.location.href = '/login';
            </script>";
        } else {
            $role = strtolower($role);
            echo "<script>
                alert('Gagal mendaftar!');
                window.location.href = '/register/$role';
            </script>";
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

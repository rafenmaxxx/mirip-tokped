<?php

require_once __DIR__ . '/../model/m_user.php';
require_once __DIR__ . '/../model/m_store.php';

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

        if ($data['status'] && strtoupper($role) === 'SELLER') {
            $userId = $data['id'];
            $storeName = $_POST['store-name'];
            $storeDesc = $_POST['store-desc'];
            $storeLogoPath = null;

            if (isset($_FILES['store-logo']) && $_FILES['store-logo']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['store-logo'];
                $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

                if (in_array($file['type'], $allowedTypes)) {
                    $uploadDir = __DIR__ . '/../../data/store/logo/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }

                    $safeStoreName = preg_replace('/[^a-zA-Z0-9_-]/', '', $storeName);
                    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $dateStr = date('Ymd_His');
                    $newName = $safeStoreName . '_' . $dateStr . '.' . $ext;

                    $uploadPath = $uploadDir . $newName;

                    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                        $storeLogoPath = '/data/store/logo/' . $newName;
                    }
                }
            }

            $storeModel = new Store();
            $store = $storeModel->createStore($userId, $storeName, $storeDesc, $storeLogoPath);
        }


        if ($data['status']) {
            echo "<script>
                alert('Berhasil mendaftarkan $email!');
                window.location.href = '/login';
            </script>";
        } else {
            $roleLower = strtolower($role);
            echo "<script>
                alert('Gagal mendaftar!');
                window.location.href = '/register/$roleLower';
            </script>";
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

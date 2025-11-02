<?php

require_once __DIR__ . '/../model/m_user.php';
require_once __DIR__ . '/../model/m_store.php';
require_once __DIR__ . '/../model/m_auth.php';
$model = new User();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? null;
        $id = $_SESSION['user']['id'] ?? null;

        if ($action) {
            switch ($action):
                case 'balance':
                    guard(['BUYER', 'SELLER']);

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
                case "address":
                    guard(['BUYER', 'SELLER']);
                    $id = $_SESSION['user']['id'];
                    $res = $model->getAddressById($id);

                    header('Content-Type: application/json');
                    if ($res) {
                        http_response_code(200);
                        echo json_encode([
                            'status' => 'success',
                            'message' => 'Get Address Success',
                            'data' => $res
                        ]);
                    } else {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'failed',
                            'message' => 'Get Address Failed',
                            'data' => $res
                        ]);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['status' => 'error', 'message' => 'Action not allowed']);
                    break;
            endswitch;
        } else if ($id) {
            guard(['BUYER', 'SELLER', 'GUEST']);
            $data = $model->getById($id);
            if ($data) {
                http_response_code(200);
                echo json_encode(['status' => 'success', 'data' => $data]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'User not found']);
            }
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        }

        break;

    case 'POST':
        guard(['GUEST']);
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
            warn("Berhasil mendaftarkan $email!", '/');
        } else {
            $roleLower = strtolower($role);
            echo "<script>
                alert('Gagal mendaftar!');
                window.location.href = '/register/$roleLower';
            </script>";
            warn("Gagal mendaftarkan user!", '/register/$roleLower');
        }
        break;

    case 'PUT':
        guard(['BUYER', 'SELLER']);
        parse_str(file_get_contents("php://input"), $_PUT);
        $id = $_SESSION['user']['id'] ?? null;

        // Helper function untuk normalisasi input
        function normalizeInput($value)
        {
            // Jika tidak ada, kosong, atau string "null", return null
            if (empty($value) || $value === 'null' || $value === 'undefined') {
                return null;
            }
            // Trim whitespace
            return trim($value);
        }

        $new_name = normalizeInput($_PUT['nama'] ?? null);
        $new_address = normalizeInput($_PUT['alamat'] ?? null);
        $new_password = normalizeInput($_PUT['password'] ?? null);

        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'User tidak ditemukan']);
            break;
        }

        // Jika tidak ada data yang akan diubah
        if (!$new_name && !$new_address && !$new_password) {
            echo json_encode(['status' => 'error', 'message' => 'Tidak ada data yang diubah']);
            break;
        }

        $data = $model->updateUser($id, $new_name, $new_address, $new_password);
        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

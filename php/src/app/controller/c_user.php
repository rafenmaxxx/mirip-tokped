<?php
require_once __DIR__ . '/../model/m_user.php';

$model = new User();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_SESSION['user']['id'] ?? null;
        
        if ($id) {
            $data = $model->getById($id);
        } else {
            $data = $model->getAll();
        }
        
        echo json_encode(['status' => 'success', 'data' => $data]);
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
            echo `<script>
                alert('Gagal mendaftar!');
                window.location.href = '/register/$role';
            </script>`;
        }

        // kalo SELLER -> register TOKO

        break;
    case 'PUT':
        parse_str(file_get_contents("php://input"), $_PUT);
        $id = $_SESSION['user']['id'] ?? null;
        
        // Helper function untuk normalisasi input
        function normalizeInput($value) {
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

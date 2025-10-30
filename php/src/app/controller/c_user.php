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
        $new_name = $_PUT['nama'] ?? null;
        $new_address = $_PUT['alamat'] ?? null;
        $new_password = $_PUT['password'] ?? null;

        if ($id && ($new_name || $new_address || $new_password)) {
            $data = $model->updateUser($id, $new_name, $new_address, $new_password);
            echo json_encode(['status' => 'success', 'data' => $data]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

<?php
require_once __DIR__ . '/../model/m_user.php';

$model = new User();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
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

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

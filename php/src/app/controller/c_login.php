<?php
require_once __DIR__ . '/../model/m_auth.php';

$model = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $email = $_POST['email'] ?? null;
        $password = $_POST['password'] ?? null;
        header('Content-Type: text/html; charset=utf-8');
        if (!$email || !$password) {
            echo "<script>
                alert('Email/Password tidak boleh kosong');
                window.location.href = '/login';
            </script>";
            exit;
        }

        $result = $model->login($email, $password);

        if ($result['status']) {
            echo "<script>
                alert('Berhasil login $email!');
                window.location.href = '/';
            </script>";
            exit;
        } else {
            $msg = urlencode($result['message']);
            echo "<script>
                alert('Gagal login $email! $msg');
                window.location.href = '/login';
            </script>";

            exit;
        }
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

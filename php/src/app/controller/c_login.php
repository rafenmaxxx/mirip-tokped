<?php
require_once __DIR__ . '/../model/m_auth.php';
require_once __DIR__ . '/../model/m_sanitizer.php';
$model = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        guard(["GUEST"]);
        $email = $_POST['email'] ?? null;
        $email = sanitizePlainText($email);
        $password = $_POST['password'] ?? null;
        $email = sanitizePlainText($password);
        header('Content-Type: text/html; charset=utf-8');
        if (!$email || !$password) {
            warn("Email/Password tidak boleh kosong", '/login');
            exit;
        }

        $result = $model->login($email, $password);

        if ($result['status']) {
            warn("Berhasil login $email!", "/");
            exit;
        } else {
            $msg = $result['message'];
            warn("Gagal login $email! Email atau password yang Anda masukkan salah.", "/login");
            exit;
        }
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

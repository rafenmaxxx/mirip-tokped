<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$route = $_GET['route'] ?? '';

switch ($route) {
    case 'home':
        echo json_encode([
            'status' => 'success',
            'data' => [
                'title' => 'Menampilkan produk',
                'content' => 'Ini konten dari backend PHP :D (teks ini)'
            ]
        ]);
        break;
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Route tidak ditemukan']);
}

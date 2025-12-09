<?php
require_once __DIR__ . '/../model/m_auth.php';
require_once __DIR__ . '/../model/m_sanitizer.php';

// Set header JSON dari awal
header('Content-Type: application/json');


guard(['BUYER', 'SELLER']);
$user = $_SESSION['user'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Validasi file upload
if (!isset($_FILES['attachment']) || $_FILES['attachment']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['attachment'];

// Validasi tipe file
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);


if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
    ]);
    exit;
}

// Validasi ukuran file (max 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'File size too large. Maximum size is 5MB.'
    ]);
    exit;
}

// Generate unique filename
$timestamp = date('YmdHis');
$randomString = bin2hex(random_bytes(8));
$originalName = $file['name'];
$fileExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Buat nama file yang aman
$safeFileName = preg_replace('/[^a-zA-Z0-9]/', '', pathinfo($originalName, PATHINFO_FILENAME));
$safeFileName = substr($safeFileName, 0, 50);

$filename = "chat_{$user['id']}_{$timestamp}_{$randomString}.{$fileExt}";

// Buat directory jika belum ada
$uploadDir = __DIR__ . '/../../data/attachments/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Path untuk disimpan
$destination = $uploadDir . $filename;

// Pindahkan file
if (move_uploaded_file($file['tmp_name'], $destination)) {
    // URL untuk diakses
    $fileUrl = "/data/attachments/" . $filename;

    echo json_encode([
        'status' => 'success',
        'data' => [
            'filename' => $filename,
            'originalname' => $originalName,
            'mimetype' => $mimeType,
            'size' => $file['size'],
            'url' => $fileUrl,
            'path' => $fileUrl,
            'user_id' => $user['id'],
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to save file'
    ]);
}
exit;

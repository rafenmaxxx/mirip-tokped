<?php
require_once __DIR__ . '/../model/m_auth.php';
require_once __DIR__ . '/../model/m_sanitizer.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
switch ($method) {
    case 'POST':
        header('Content-Type: text/html; charset=utf-8');
        guard(['SELLER', 'BUYER']);


        $main_image_path = null;
        if (isset($_FILES['attachment-img']) && $_FILES['attachment-img']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../data/attachment/';
            $maxSizeMB = 2;
            $maxSizeBytes = $maxSizeMB * 1024 * 1024;

            $fileSize = $_FILES['attachment-img']['size'];
            if ($fileSize > $maxSizeBytes) {
                exit;
            }
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExt = pathinfo($_FILES['attachment-img']['name'], PATHINFO_EXTENSION);
            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', strtolower($nama_produk));
            $timestamp = date('YmdHis');
            $filename = "{$safeName}_{$store_id}_{$timestamp}.{$fileExt}";
            $destination = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['attachment-img']['tmp_name'], $destination)) {
                $main_image_path = "/data/attachment/" . $filename;
            } else {
                exit;
            }
        }

        break;
}

<?php

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // ambil parameter file
        $image = $_GET['file'] ?? '';   // <<< ini yang hilang
        if ($image === '') {
            http_response_code(400);
            exit('No file specified');
        }

        // hapus slash awal agar path relatif
        $image = ltrim($image, '/');

        // path file di server
        $imagePath = __DIR__ . '/../../' . $image;

        if (!file_exists($imagePath)) {
            http_response_code(404);
            exit('Image not found');
        }

        // set header content type sesuai file extension
        $ext = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));
        switch ($ext) {
            case 'jpg':
            case 'jpeg':
                header('Content-Type: image/jpeg');
                break;
            case 'png':
                header('Content-Type: image/png');
                break;
            case 'gif':
                header('Content-Type: image/gif');
                break;
            default:
                header('Content-Type: application/octet-stream');
        }

        readfile($imagePath);
        exit;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

<?php
require_once __DIR__ . '/../model/m_image.php';
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':

        $image = $_GET['file'] ?? '';
        if ($image === '') {
            http_response_code(400);
            exit('No file specified');
        }


        $image = ltrim($image, '/');


        $imagePath = __DIR__ . '/../../' . $image;

        if (!file_exists($imagePath)) {
            http_response_code(404);
            exit('Image not found');
        }


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

    case 'POST':
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No image uploaded']);
            exit;
        }

        $file = $_FILES['image'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Upload failed']);
            exit;
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid file type']);
            exit;
        }


        $uploadDir = __DIR__ . '/../../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }


        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newName = uniqid('img_', true) . '.' . $ext;
        $uploadPath = $uploadDir . $newName;


        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {

            $relativePath = 'uploads/' . $newName;
            echo json_encode([
                'status' => 'success',
                'message' => 'Image uploaded successfully',
                'path' => $relativePath
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to save file']);
        }
        exit;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

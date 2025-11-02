<?php
require_once __DIR__ . '/../model/m_product.php';
require_once __DIR__ . '/../model/m_auth.php';
$model = new Product();
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
switch ($method) {
    case 'GET':
        $search = $_GET['search'] ?? null;
        $id = $_GET['id'] ?? null;
        $store_id = $_SESSION['user']['store_id'] ?? null;
        $filter = $_GET['filter'] ?? null;
        $title = $_GET['title'] ?? null;

        if ($search) {

            $data = $model->getByName($search);
        } else if ($id) {

            $data = $model->getDetailById($id);
        } else if ($title) {

            $data = $model->getTitle($title);
        } else if ($filter && $store_id) {
            // ada filter dan store_id -> filter product by store_id
            $filterData = json_decode($filter, true);
            $categories = $filterData['categories'] ?? [];
            $minPrice = $filterData['minPrice'] ?? null;
            $maxPrice = $filterData['maxPrice'] ?? null;

            $data = $model->getFilterProductByStore($store_id, $categories, $minPrice, $maxPrice);
        } else if ($filter) {

            $filterData = json_decode($filter, true);
            $categories = $filterData['categories'] ?? [];
            $minPrice = $filterData['minPrice'] ?? null;
            $maxPrice = $filterData['maxPrice'] ?? null;

            $data = $model->getFilterProduct($categories, $minPrice, $maxPrice);
        } else if ($store_id) {

            $data = $model->getByStoreId($store_id);
        } else {

            $data = $model->getAll();
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    case 'POST':
        header('Content-Type: application/json');
        guard(['SELLER']);

        $store_id = $_SESSION['user']['store_id'] ?? null;
        if (!$store_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Store ID not found']);
            exit;
        }


        $nama_produk = trim($_POST['nama_produk'] ?? '');
        $deskripsi   = $_POST['deskripsi'] ?? '';
        $harga       = (int) ($_POST['harga'] ?? 0);
        $stok        = (int) ($_POST['stok'] ?? 0);
        $categories  = $_POST['categories'] ?? [];



        if (empty($nama_produk) || $harga < 0 || $stok < 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Data tidak valid']);
            exit;
        }


        $main_image_path = null;
        if (isset($_FILES['product-img']) && $_FILES['product-img']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../data/products/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExt = pathinfo($_FILES['product-img']['name'], PATHINFO_EXTENSION);
            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', strtolower($nama_produk));
            $timestamp = date('YmdHis');
            $filename = "{$safeName}_{$store_id}_{$timestamp}.{$fileExt}";
            $destination = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['product-img']['tmp_name'], $destination)) {
                $main_image_path = "/data/products/" . $filename;
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Gagal upload file']);
                exit;
            }
        }


        $result = $model->createProduct(
            $store_id,
            $nama_produk,
            $deskripsi,
            $harga,
            $stok,
            $main_image_path,
            $categories
        );

        if ($result) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Produk berhasil ditambahkan',
                'data' => ['product_id' => $result]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal menambahkan produk']);
        }

        break;
    case 'PUT':
        header('Content-Type: application/json');
        guard(['SELLER']);

        $product_id  = $_POST['product_id'] ?? null;
        $nama_produk = trim($_POST['nama_produk'] ?? '');
        $deskripsi   = $_POST['deskripsi'] ?? '';
        $harga       = (int) ($_POST['harga'] ?? 0);
        $stok        = (int) ($_POST['stok'] ?? 0);
        $categories  = $_POST['categories'] ?? [];

        if (!$product_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Product ID tidak ditemukan']);
            exit;
        }


        $main_image_path = null;
        if (isset($_FILES['product-img']) && $_FILES['product-img']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../data/products/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExt = pathinfo($_FILES['product-img']['name'], PATHINFO_EXTENSION);
            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', strtolower($nama_produk));
            $timestamp = date('YmdHis');
            $filename = "{$safeName}_update_{$timestamp}.{$fileExt}";
            $destination = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['product-img']['tmp_name'], $destination)) {
                $main_image_path = "/data/products/" . $filename;
            }
        }


        $result = $model->updateProduct(
            $product_id,
            $nama_produk,
            $deskripsi,
            $harga,
            $stok,
            $main_image_path,
            $categories
        );

        if ($result) {
            echo json_encode(['status' => 'success', 'message' => 'Produk berhasil diperbarui']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui produk']);
        }
        break;
    case 'DELETE':
        guard(['SELLER']);
        $product_id = $_GET['product_id'] ?? null;
        if (!$product_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Kurang Parameter product_id']);
        }
        $data = $model->DeleteById($product_id);
        if ($data) {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'data' => $data]);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus produk', 'data' => $data]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

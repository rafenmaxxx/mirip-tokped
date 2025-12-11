<?php
require_once __DIR__ . '/../model/m_product.php';
require_once __DIR__ . '/../model/m_auth.php';
require_once __DIR__ . '/../model/m_sanitizer.php';

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
        if (!$store_id) {
            $store_id = $_GET['store_id'] ?? null;
        }
        $filter = $_GET['filter'] ?? null;
        $title = $_GET['title'] ?? null;
        $page = $_GET['page'] ?? null;
        $limit = $_GET['limit'] ?? null;
        $sort = $_GET['sort'] ?? null;

        if ($search) {
            guard(['BUYER', 'GUEST']);
            $count = $model->countByName($search);
            $data = $model->getByName($search, $page, $limit);
        } else if ($store_id && $filter && $title) {
            guard(['SELLER']);
            $filterData = json_decode($filter, true);
            $categories = $filterData['categories'] ?? [];
            $minPrice = $filterData['minPrice'] ?? null;
            $maxPrice = $filterData['maxPrice'] ?? null;

            $count = $model->countFilterProductByStoreAndName($store_id, $title, $categories, $minPrice, $maxPrice);
            $data = $model->getFilterProductByStoreAndName($store_id, $title, $page, $limit, $minPrice, $maxPrice, $categories, $sort);
        } else if ($store_id && $filter) {
            guard(['SELLER']);
            $filterData = json_decode($filter, true);
            $categories = $filterData['categories'] ?? [];
            $minPrice = $filterData['minPrice'] ?? null;
            $maxPrice = $filterData['maxPrice'] ?? null;

            $count = $model->countFilterProductByStore($store_id, $categories, $minPrice, $maxPrice);
            $data = $model->getFilterProductByStore($store_id, $categories, $minPrice, $maxPrice, $page, $limit, $sort);
        } else if ($store_id && $title) {
            guard(['SELLER']);
            $count = $model->countProductByStoreAndName($store_id, $title);
            $data = $model->getProductByStoreAndName($store_id, $title, $page, $limit, $sort);
        } else if ($id) {
            guard(['BUYER', 'GUEST', 'SELLER']);
            if (isset($_SESSION['user'])) {
                if ($_SESSION['user']['role'] == 'SELLER') {
                    $data = $model->getDetailById($id, $_SESSION['user']['id']);
                } else {
                    $data = $model->getDetailById($id);
                }
            } else {
                $data = $model->getDetailById($id);
            }
        } else if ($title) {
            guard(['BUYER', 'GUEST']);
            $data = $model->getTitle($title);
        } else if ($filter) {
            guard(['BUYER', 'GUEST']);
            $filterData = json_decode($filter, true);
            $categories = $filterData['categories'] ?? [];
            $minPrice = $filterData['minPrice'] ?? null;
            $maxPrice = $filterData['maxPrice'] ?? null;

            $count = $model->countFilterProduct($categories, $minPrice, $maxPrice);
            $data = $model->getFilterProduct($categories, $minPrice, $maxPrice, $page, $limit, $sort);
        } else if ($store_id) {
            guard(['BUYER', 'SELLER', 'GUEST']);
            $count = $model->countByStoreId($store_id);
            $data = $model->getByStoreId($store_id, $page, $limit, $sort);
        } else {
            guard(['BUYER', 'GUEST']);
            $count = $model->countAll();
            $data = $model->getAll($page, $limit);
        }
        if ($data) {
            echo json_encode(['status' => 'success', 'data' => $data, 'count' => $count ?? null]);
        } else {
            echo json_encode(['status' => 'failed', 'data' => $data, 'count' => $count ?? null]);
        }

        break;

    case 'POST':
        header('Content-Type: text/html; charset=utf-8');
        guard(['SELLER']);

        $store_id = $_SESSION['user']['store_id'] ?? null;


        $nama_produk = trim($_POST['nama_produk'] ?? '');
        $deskripsi   = $_POST['deskripsi'] ?? '';
        $harga       = (int) ($_POST['harga'] ?? 0);
        $stok        = (int) ($_POST['stok'] ?? 0);
        $categories  = $_POST['categories'] ?? [];

        $nama_produk = sanitizePlainText($nama_produk);
        $deskripsi   = sanitizeRTEInput($deskripsi);


        if (empty($nama_produk) || $harga < 0 || $stok < 0) {
            warn('Parameter Kurang', '/seller/products/add');
            exit;
        }


        $main_image_path = null;
        if (isset($_FILES['product-img']) && $_FILES['product-img']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../data/products/';
            $maxSizeMB = 2;
            $maxSizeBytes = $maxSizeMB * 1024 * 1024;

            $fileSize = $_FILES['product-img']['size'];
            if ($fileSize > $maxSizeBytes) {
                warn("Ukuran file melebihi {$maxSizeMB} MB", '/seller/products/add');
                exit;
            }
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
                warn('Gagal Upload foto', '/seller/products/add');
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
            warn('Berhasil menambahkan Produk', '/seller/products');
            exit;
        } else {
            warn('Gagal Menambahkan Product', '/seller/products/add');
            exit;
        }

    case 'PUT':
        header('Content-Type: text/html; charset=utf-8');
        guard(['SELLER']);

        $product_id  = $_POST['product_id'] ?? null;
        $nama_produk = trim($_POST['nama_produk'] ?? '');
        $deskripsi   = $_POST['deskripsi'] ?? '';
        $harga       = (int) ($_POST['harga'] ?? 0);
        $stok        = (int) ($_POST['stok'] ?? 0);
        $categories  = $_POST['categories'] ?? [];

        $nama_produk = sanitizePlainText($nama_produk);
        $deskripsi   = sanitizeRTEInput($deskripsi);

        if (!$product_id) {
            warn('Gaada product id', '/seller/products');
            exit;
        }


        $main_image_path = null;
        if (isset($_FILES['product-img']) && $_FILES['product-img']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../data/products/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $maxSizeMB = 2;
            $maxSizeBytes = $maxSizeMB * 1024 * 1024;

            $fileSize = $_FILES['product-img']['size'];
            if ($fileSize > $maxSizeBytes) {
                warn("Ukuran file melebihi {$maxSizeMB} MB", '/seller/products/add');
                exit;
            }

            $fileExt = pathinfo($_FILES['product-img']['name'], PATHINFO_EXTENSION);
            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', strtolower($nama_produk));
            $timestamp = date('YmdHis');
            $filename = "{$safeName}_update_{$timestamp}.{$fileExt}";
            $destination = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['product-img']['tmp_name'], $destination)) {
                $main_image_path = "/data/products/" . $filename;
            } else {
                warn('Gagal upload image', '/seller/products');
                exit;
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
            warn("Produk berhasil di update !", "/seller/products");
            exit;
        } else {
            warn('Gagal update Product', '/seller/products');
            exit;
        }

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

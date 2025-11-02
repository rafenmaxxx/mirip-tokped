<?php
require_once __DIR__ . '/../model/m_store.php';
require_once __DIR__ . '/../model/m_product.php';
require_once __DIR__ . '/../model/m_auth.php';
$model = new Store();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $store_id = $_GET['store_id'] ?? null;

        if ($store_id) {
            guard(['SELLER', 'BUYER', 'GUEST']);
            $data = $model->getByStoreId($store_id);
        } else {
            guard(['SELLER']);
            $id = $_SESSION['user']['id'];

            $data = $model->getStoreByUserId($id);
        }

        echo json_encode(['status' => 'success', 'data' => $data]);
        break;

    case 'POST':
        guard(['SELLER']);
        $store_id = $_SESSION['user']['store_id'] ?? null;
        $store_name = $_POST['store_name'] ?? null;
        $store_description = $_POST['store_description'] ?? null;

        if (isset($_FILES['gambar_toko']) && $_FILES['gambar_toko']['error'] == 0) {

            $file_name = uniqid() . '-' . basename($_FILES['gambar_toko']['name']);
            $path_to_save_in_db = "/data/store/" . $file_name;
            $target_directory = dirname(dirname(__DIR__)) . "/data/store/";
            $file_system_path = $target_directory . $file_name;

            if (!move_uploaded_file($_FILES['gambar_toko']['tmp_name'], $file_system_path)) {
                echo json_encode(['status' => 'error', 'message' => 'Gagal meng-upload gambar.']);
                exit;
            }

            $result = $model->updateStoreWithLogo($store_id, $store_name, $store_description, $path_to_save_in_db);
        } else {

            $result = $model->updateStore($store_id, $store_name, $store_description);
        }

        echo json_encode(['status' => 'success', 'message' => 'Store updated successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}

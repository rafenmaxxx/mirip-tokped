<?php
require_once __DIR__ . '/../db/db.php';
require_once __DIR__ . '/../model/m_user.php';

class Order
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function getAll()
    {

        $stmt = $this->conn->prepare("SELECT * FROM orders");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getById($id, $user_id)
    {
        if ($_SESSION['user']['role'] == 'BUYER') {
            $stmt = $this->conn->prepare("SELECT * FROM orders WHERE order_id=:id AND buyer_id = :user_id");
            $stmt->execute([':id' => $id, ':user_id' => $user_id]);
        }

        if ($_SESSION['user']['role'] == 'SELLER') {
            $stmt = $this->conn->prepare("SELECT * FROM orders o JOIN stores s ON o.store_id = s.store_id WHERE o.order_id=:id AND s.user_id = :user_id");
            $stmt->execute([':id' => $id, ':user_id' => $user_id]);
        }

        return $stmt->fetch();
    }

    public function getByUserId($user_id)
    {
        $sql = "
            SELECT 
                o.*, 
                s.store_name, p.product_name, p.main_image_path, oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_order, oi.subtotal
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            JOIN stores s ON o.store_id = s.store_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = :user_id
            ORDER BY o.created_at DESC
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':user_id' => $user_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orders = [];
        foreach ($rows as $row) {
            $order_id = $row['order_id'];

            // Jika order ini belum dimasukkan ke array
            if (!isset($orders[$order_id])) {
                $orders[$order_id] = [
                    'order_id' => $row['order_id'],
                    'buyer_id' => $row['buyer_id'],
                    'store_id' => $row['store_id'],
                    'store_name' => $row['store_name'],
                    'total_price' => $row['total_price'],
                    'shipping_address' => $row['shipping_address'],
                    'status' => $row['status'],
                    'reject_reason' => $row['reject_reason'],
                    'confirmed_at' => $row['confirmed_at'],
                    'delivery_time' => $row['delivery_time'],
                    'received_at' => $row['received_at'],
                    'created_at' => $row['created_at'],
                    'items' => []
                ];
            }

            // Jika ada item terkait, tambahkan
            if ($row['order_item_id']) {
                $orders[$order_id]['items'][] = [
                    'order_item_id' => $row['order_item_id'],
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'main_image_path' => $row['main_image_path'],
                    'quantity' => $row['quantity'],
                    'price_at_order' => $row['price_at_order'],
                    'subtotal' => $row['subtotal']
                ];
            }
        }

        // Ubah dari associative ke numerik array
        return array_values($orders);
    }


    public function createOrder($buyer_id, $store_id, $total_price, $shipping_address)
    {
        $stmt = $this->conn->prepare("INSERT INTO orders (buyer_id, store_id, total_price, shipping_address, created_at) VALUES (:buyer_id, :store_id, :total_price, :shipping_address, NOW()");
        $stmt->execute([
            ':buyer_id' => $buyer_id,
            ':store_id' => $store_id,
            ':total_price' => $total_price,
            ':shipping_address' => $shipping_address
        ]);
        return $stmt;
    }

    public function updateOrderStatus($order_id, $status, $durasi = null)
    {

        $timeColumn = match ($status) {
            'approved'     => 'confirmed_at',
            'rejected'     => 'confirmed_at',
            'on_delivery'  => 'delivery_time',
            'received'     => 'received_at',
            default        => null,
        };


        $query = "UPDATE orders SET status = :status";


        if ($timeColumn) {
            if ($status === 'on_delivery' && $durasi !== null) {

                $query .= ", {$timeColumn} = NOW() + INTERVAL '{$durasi} day'";
            } else {
                $query .= ", {$timeColumn} = NOW()";
            }
        }

        $query .= " WHERE order_id = :order_id";


        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            ':status' => $status,
            ':order_id' => $order_id
        ]);

        return $stmt->rowCount();
    }


    public function updateOrderRejectReason($order_id, $reject_reason)
    {
        $stmt = $this->conn->prepare("UPDATE orders SET reject_reason=:reject_reason WHERE order_id=:order_id");
        $stmt->execute([
            ':reject_reason' => $reject_reason,
            ':order_id' => $order_id
        ]);
        return $stmt;
    }

    public function deleteOrder($order_id)
    {
        $stmt = $this->conn->prepare("DELETE FROM orders WHERE order_id=:order_id");
        $stmt->execute([':order_id' => $order_id]);
        return $stmt;
    }

    public function getOrderByStore($store_id, $page, $limit)
    {
        $sql = "
        SELECT 
            o.*, 
            u.name AS buyer_name,
            p.product_name, p.main_image_path, 
            oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_order, oi.subtotal
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN users u ON o.buyer_id = u.user_id
        WHERE o.store_id = ?
        ORDER BY o.created_at DESC
    ";

        $params = [$store_id];

        if ($page !== null && $limit !== null) {
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orders = [];
        foreach ($rows as $row) {
            $order_id = $row['order_id'];

            if (!isset($orders[$order_id])) {
                $orders[$order_id] = [
                    'order_id' => $row['order_id'],
                    'buyer_id' => $row['buyer_id'],
                    'buyer_name' => $row['buyer_name'],
                    'store_id' => $row['store_id'],
                    'total_price' => $row['total_price'],
                    'shipping_address' => $row['shipping_address'],
                    'status' => $row['status'],
                    'reject_reason' => $row['reject_reason'],
                    'confirmed_at' => $row['confirmed_at'],
                    'delivery_time' => $row['delivery_time'],
                    'received_at' => $row['received_at'],
                    'created_at' => $row['created_at'],
                    'items' => []
                ];
            }

            if ($row['order_item_id']) {
                $orders[$order_id]['items'][] = [
                    'order_item_id' => $row['order_item_id'],
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'main_image_path' => $row['main_image_path'],
                    'quantity' => $row['quantity'],
                    'price_at_order' => $row['price_at_order'],
                    'subtotal' => $row['subtotal']
                ];
            }
        }

        return array_values($orders);
    }

    public function countOrderByStore($store_id)
    {
        $sql = "
            SELECT COUNT(order_id) 
            FROM orders
            WHERE store_id = :store_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':store_id' => $store_id]);

        return (int)$stmt->fetchColumn();
    }

    public function getOrderByStoreAndStatus($store_id, $status, $page, $limit)
    {
        $sql = "
        SELECT 
            o.*, 
            u.name AS buyer_name,
            p.product_name, p.main_image_path, 
            oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_order, oi.subtotal
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN users u ON o.buyer_id = u.user_id
        WHERE o.store_id = ? AND o.status = ?
        ORDER BY o.created_at DESC
    ";

        $params = [$store_id, $status];

        if ($page !== null && $limit !== null) {
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orders = [];
        foreach ($rows as $row) {
            $order_id = $row['order_id'];

            if (!isset($orders[$order_id])) {
                $orders[$order_id] = [
                    'order_id' => $row['order_id'],
                    'buyer_id' => $row['buyer_id'],
                    'buyer_name' => $row['buyer_name'],
                    'store_id' => $row['store_id'],
                    'total_price' => $row['total_price'],
                    'shipping_address' => $row['shipping_address'],
                    'status' => $row['status'],
                    'reject_reason' => $row['reject_reason'],
                    'confirmed_at' => $row['confirmed_at'],
                    'delivery_time' => $row['delivery_time'],
                    'received_at' => $row['received_at'],
                    'created_at' => $row['created_at'],
                    'items' => []
                ];
            }

            if ($row['order_item_id']) {
                $orders[$order_id]['items'][] = [
                    'order_item_id' => $row['order_item_id'],
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'main_image_path' => $row['main_image_path'],
                    'quantity' => $row['quantity'],
                    'price_at_order' => $row['price_at_order'],
                    'subtotal' => $row['subtotal']
                ];
            }
        }

        return array_values($orders);
    }

    public function countOrderByStoreAndStatus($store_id, $status)
    {
        $sql = "
            SELECT COUNT(order_id) 
            FROM orders
            WHERE store_id = :store_id AND status = :status
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':store_id' => $store_id,
            ':status' => $status
        ]);

        return (int)$stmt->fetchColumn();
    }

    public function getOrderByStoreAndName($store_id, $title, $page, $limit)
    {
        $sql = "
        SELECT 
            o.*, 
            u.name AS buyer_name,
            p.product_name, p.main_image_path, 
            oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_order, oi.subtotal
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN users u ON o.buyer_id = u.user_id
        WHERE o.store_id = ? AND p.product_name ILIKE ?
        ORDER BY o.created_at DESC
    ";

        $params = [$store_id, "%$title%"];

        if ($page !== null && $limit !== null) {
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orders = [];
        foreach ($rows as $row) {
            $order_id = $row['order_id'];

            if (!isset($orders[$order_id])) {
                $orders[$order_id] = [
                    'order_id' => $row['order_id'],
                    'buyer_id' => $row['buyer_id'],
                    'buyer_name' => $row['buyer_name'],
                    'store_id' => $row['store_id'],
                    'total_price' => $row['total_price'],
                    'shipping_address' => $row['shipping_address'],
                    'status' => $row['status'],
                    'reject_reason' => $row['reject_reason'],
                    'confirmed_at' => $row['confirmed_at'],
                    'delivery_time' => $row['delivery_time'],
                    'received_at' => $row['received_at'],
                    'created_at' => $row['created_at'],
                    'items' => []
                ];
            }

            if ($row['order_item_id']) {
                $orders[$order_id]['items'][] = [
                    'order_item_id' => $row['order_item_id'],
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'main_image_path' => $row['main_image_path'],
                    'quantity' => $row['quantity'],
                    'price_at_order' => $row['price_at_order'],
                    'subtotal' => $row['subtotal']
                ];
            }
        }

        return array_values($orders);
    }

    public function countOrderByStoreAndName($store_id, $title)
    {
        $sql = "
            SELECT COUNT(DISTINCT o.order_id) 
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            WHERE o.store_id = :store_id AND p.product_name ILIKE :title
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':store_id' => $store_id,
            ':title' => "%$title%"
        ]);

        return (int)$stmt->fetchColumn();
    }

    public function getOrderByStoreAndStatusAndName($store_id, $status, $title, $page, $limit)
    {
        $sql = "
        SELECT 
            o.*, 
            u.name AS buyer_name,
            p.product_name, p.main_image_path, 
            oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_order, oi.subtotal
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN users u ON o.buyer_id = u.user_id
        WHERE o.store_id = ? AND o.status = ? AND p.product_name ILIKE ?
        ORDER BY o.created_at DESC
    ";

        $params = [$store_id, $status, "%$title%"];

        if ($page !== null && $limit !== null) {
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orders = [];
        foreach ($rows as $row) {
            $order_id = $row['order_id'];

            if (!isset($orders[$order_id])) {
                $orders[$order_id] = [
                    'order_id' => $row['order_id'],
                    'buyer_id' => $row['buyer_id'],
                    'buyer_name' => $row['buyer_name'],
                    'store_id' => $row['store_id'],
                    'total_price' => $row['total_price'],
                    'shipping_address' => $row['shipping_address'],
                    'status' => $row['status'],
                    'reject_reason' => $row['reject_reason'],
                    'confirmed_at' => $row['confirmed_at'],
                    'delivery_time' => $row['delivery_time'],
                    'received_at' => $row['received_at'],
                    'created_at' => $row['created_at'],
                    'items' => []
                ];
            }

            if ($row['order_item_id']) {
                $orders[$order_id]['items'][] = [
                    'order_item_id' => $row['order_item_id'],
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'main_image_path' => $row['main_image_path'],
                    'quantity' => $row['quantity'],
                    'price_at_order' => $row['price_at_order'],
                    'subtotal' => $row['subtotal']
                ];
            }
        }

        return array_values($orders);
    }

    public function countOrderByStoreAndStatusAndName($store_id, $status, $title)
    {
        $sql = "
            SELECT COUNT(DISTINCT o.order_id) 
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            WHERE o.store_id = :store_id AND o.status = :status AND p.product_name ILIKE :title
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':store_id' => $store_id,
            ':status' => $status,
            ':title' => "%$title%"
        ]);

        return (int)$stmt->fetchColumn();
    }

    public function updateStatus($order_id, $status, $msg = null, $durasi = null)
    {
        // ambil status sekarang
        $stmt = $this->conn->prepare("SELECT status,total_price,buyer_id,store_id,delivery_time FROM orders WHERE order_id=:id");
        $stmt->execute([':id' => $order_id]);
        $res = $stmt->fetch();
        $isValid = false;
        $curr_stats = $res['status'];
        $price = $res['total_price'];
        $buyer_id = $res['buyer_id'];
        $store_id = $res['store_id'];
        $delivery = $res['delivery_time'];

        switch ($curr_stats) {
            case 'waiting_approval':
                switch ($status) {
                    case 'approved':
                        $isValid = true;
                        break;
                    case 'rejected':
                        $isValid = true;
                        $this->updateOrderRejectReason($order_id, $msg);

                        // update balance user
                        $model = new User();
                        $model->addBalance($buyer_id, $price);
                        break;
                    default:
                        $isValid = false;
                        break;
                }
                break;
            case 'approved':
                switch ($status) {
                    case 'on_delivery':
                        $isValid = true;
                        break;

                    default:
                        $isValid = false;
                        break;
                }
                break;
            case 'rejected':
                $isValid = false;
                break;
            case 'on_delivery':
                switch ($status) {
                    case 'received':
                        // update balance seller
                        // tambah validasi user baru bisa confirm klo tanggal sekarang > delivered time
                        $now = new DateTime();
                        $deliveryTime = new DateTime($delivery);
                        if ($now > $deliveryTime) {
                            $model = new User();
                            $model->addBalanceByStoreId($store_id, $price);
                            $isValid = true;
                        } else {
                            $isValid = false;
                        }

                        break;

                    default:
                        $isValid = false;
                        break;
                }
                break;
            case 'received':
                $isValid = false;
                break;
            default:
                $isValid = false;
                break;
        }
        if ($isValid) {
            $data = $this->updateOrderStatus($order_id, $status, $durasi);
        } else {
            $data = null;
        }
        return $data;
    }
}

<?php
require_once __DIR__ . '/../db/db.php';

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

    public function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM orders WHERE order_id=:id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
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

    public function updateOrderStatus($order_id, $status)
    {
        $stmt = $this->conn->prepare("UPDATE orders SET status=:status WHERE order_id=:order_id");
        $stmt->execute([
            ':status' => $status,
            ':order_id' => $order_id
        ]);
        return $stmt;
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

   
}

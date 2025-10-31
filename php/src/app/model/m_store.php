<?php
require_once __DIR__ . '/../db/db.php';

class Store
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function createStore($user_id, $store_name, $store_description, $store_logo_path)
    {
        try {
            $stmt = $this->conn->prepare("
            INSERT INTO stores (user_id, store_name, store_description, store_logo_path, balance)
            VALUES (:user_id, :store_name, :store_description, :store_logo_path, 0)
        ");

            $success = $stmt->execute([
                "user_id" => $user_id,
                "store_name" => $store_name,
                "store_description" => $store_description,
                "store_logo_path" => $store_logo_path
            ]);

            if ($success) {
                return [
                    "status" => true,
                    "id" => $this->conn->lastInsertId()
                ];
            } else {
                return [
                    "status" => false,
                    "message" => "Insert store failed for unknown reason"
                ];
            }
        } catch (PDOException $e) {
            return [
                "status" => false,
                "message" => $e->getMessage()
            ];
        }
    }

    public function getByStoreId($store_id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM stores WHERE store_id=:store_id");
        $stmt->execute([':store_id' => $store_id]);
        return $stmt->fetch();
    }

    public function getStoreByUserId($seller_id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM stores WHERE user_id=:id");
        $stmt->execute([':id' => $seller_id]);
        return $stmt->fetch();
    }
}

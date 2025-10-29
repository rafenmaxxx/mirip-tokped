<?php
require_once __DIR__ . '/../db/db.php';

class Store
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function createStore($name, $email, $password, $address, $role, $balance)
    {
        try {
            $stmt = $this->conn->prepare("
            INSERT INTO users (email, password, role, name, address, balance)
            VALUES (:email, :password, :role, :name, :address, :balance)
        ");

            $success = $stmt->execute([
                "email" => $email,
                "password" => $password,
                "role" => $role,
                "name" => $name,
                "address" => $address,
                "balance" => $balance
            ]);

            if ($success) {
                return [
                    "status" => true,
                    "id" => $this->conn->lastInsertId()
                ];
            } else {
                return [
                    "status" => false,
                    "message" => "Insert failed for unknown reason"
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
}

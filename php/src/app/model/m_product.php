<?php
require_once __DIR__ . '/../db/db.php';

class Product
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function getAll()
    {
        /* 
            NOTE : fetchall ada potensi masalah klo ternyata isi tabel products ini ada ratusan juta... 
            soalnya si memori db ga kuat :D
        */

        $stmt = $this->conn->prepare("SELECT * FROM products");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getDetailById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products p JOIN stores s ON p.store_id = s.store_id WHERE p.product_id=:id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function getByName($name)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products p WHERE p.product_name ILIKE :name OR p.description ILIKE :name");
        $stmt->execute([":name" => "%$name%"]);
        return $stmt->fetchAll();
    }

    public function getByStoreId($store_id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE store_id=:store_id");
        $stmt->execute([':store_id' => $store_id]);
        return $stmt->fetchAll();
    }
}

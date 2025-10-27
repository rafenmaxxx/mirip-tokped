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

    public function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE id=:id");
        $res = $stmt->execute([':id' => $id]);
        return $res;
    }

    public function getByStoreId($store_id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE store_id=:store_id");
        $stmt->execute([':store_id' => $store_id]);
        return $stmt->fetchAll();
    }
}

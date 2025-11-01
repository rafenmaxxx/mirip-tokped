<?php
require_once __DIR__ . '/../db/db.php';

class Category
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function getAll()
    {
        $sql = "SELECT DISTINCT name FROM categories";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getCategoriesForProduct($productId)
    {
        $sql = "SELECT DISTINCT c.name AS category_name
              FROM products p
              LEFT JOIN category_items ci ON p.product_id = ci.product_id
              LEFT JOIN categories c ON ci.category_id = c.category_id
              WHERE p.product_id = :productId";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':productId', $productId);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}

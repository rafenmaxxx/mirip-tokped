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

    public function getTitle($search)
    {
        $stmt = $this->conn->prepare("SELECT product_name FROM products p WHERE p.product_name ILIKE :search");
        $stmt->execute([":search" => "%$search%"]);
        return $stmt->fetchAll();
    }

    public function getFilterProduct($categories = [], $minPrice = null, $maxPrice = null)
    {
        $query = "SELECT DISTINCT p.* 
              FROM products p
              LEFT JOIN category_items ci ON p.product_id = ci.product_id
              LEFT JOIN categories c ON ci.category_id = c.category_id
              WHERE 1=1";
        $params = [];

        if (!empty($categories)) {
            $placeholders = implode(',', array_fill(0, count($categories), '?'));
            $query .= " AND c.name IN ($placeholders)";
            $params = array_merge($params, $categories);
        }

        if ($minPrice !== null) {
            $query .= " AND p.price >= ?";
            $params[] = $minPrice;
        }

        if ($maxPrice !== null) {
            $query .= " AND p.price <= ?";
            $params[] = $maxPrice;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByStoreId($store_id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE store_id=:store_id");
        $stmt->execute([':store_id' => $store_id]);
        return $stmt->fetchAll();
    }

    public function createProduct($store_id, $product_name, $description, $price, $stock, $main_image_path = null)
    {
        try {
            $stmt = $this->conn->prepare("
            INSERT INTO products (
                store_id, product_name, description, price, stock, main_image_path, created_at, updated_at
            ) VALUES (
                :store_id, :product_name, :description, :price, :stock, :main_image_path, NOW(), NOW()
            )
            RETURNING product_id
        ");

            $stmt->execute([
                ':store_id' => $store_id,
                ':product_name' => $product_name,
                ':description' => $description,
                ':price' => $price,
                ':stock' => $stock,
                ':main_image_path' => $main_image_path
            ]);

            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error saat membuat produk: " . $e->getMessage());
            return false;
        }
    }
}

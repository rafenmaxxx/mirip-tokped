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
        $sql = "
        SELECT 
            p.*,
            s.store_name,
            s.store_description,
            s.store_logo_path,
            COALESCE(JSON_AGG(c.name) FILTER (WHERE c.name IS NOT NULL), '[]') AS categories
        FROM products p
        JOIN stores s ON p.store_id = s.store_id
        LEFT JOIN category_items ci ON p.product_id = ci.product_id
        LEFT JOIN categories c ON ci.category_id = c.category_id
        WHERE p.product_id = :id
        GROUP BY p.product_id, s.store_id
    ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // ubah hasil JSON jadi array PHP
        if ($row && isset($row['categories'])) {
            $row['categories'] = json_decode($row['categories'], true);
        }

        return $row;
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

    public function createProduct($store_id, $product_name, $description, $price, $stock, $main_image_path = null, $categories = [])
    {
        try {
            $this->conn->beginTransaction();

            // Insert ke tabel products
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

            $product_id = $stmt->fetchColumn();

            // Insert ke category_items jika ada kategori
            if (!empty($categories)) {
                $catStmt = $this->conn->prepare("
                INSERT INTO category_items (category_id, product_id)
                VALUES (:category_id, :product_id)
            ");

                foreach ($categories as $cat_id) {
                    $catStmt->execute([
                        ':category_id' => $cat_id,
                        ':product_id' => $product_id
                    ]);
                }
            }

            $this->conn->commit();
            return $product_id;
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Error saat membuat produk: " . $e->getMessage());
            return false;
        }
    }
}

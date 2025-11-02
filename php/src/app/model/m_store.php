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
        $sql = "
        SELECT 
            s.*,
            -- Total produk unik milik toko ini
            (SELECT COUNT(*) 
             FROM products p 
             WHERE p.store_id = s.store_id) AS total_products,

            -- Pending orders (belum selesai)
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.store_id = s.store_id 
               AND o.status IN ('waiting_approval')) AS pending_orders,

            -- Produk stok menipis (stok di bawah 5, ubah jika kamu punya kolom stok)
            (SELECT COUNT(*) 
             FROM products p 
             WHERE p.store_id = s.store_id 
               AND p.stock < 5) AS low_stock_products,

            -- Total pendapatan dari semua pesanan yang sudah diterima
            (SELECT COALESCE(SUM(o.total_price), 0)
             FROM orders o 
             WHERE o.store_id = s.store_id 
               AND o.status = 'received') AS total_revenue

        FROM stores s
        WHERE s.user_id = :id
        LIMIT 1;
    ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':id' => $seller_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStore($store_id, $store_name, $store_description)
    {
        try {
            $stmt = $this->conn->prepare("
            UPDATE stores 
            SET store_name = :store_name, 
                store_description = :store_description
            WHERE store_id = :store_id
        ");
            $stmt->execute([
                "store_name" => $store_name,
                "store_description" => $store_description,
                "store_id" => $store_id
            ]);

            return [
                "status" => true,
                "message" => "Store updated successfully"
            ];
        } catch (PDOException $e) {
            return [
                "status" => false,
                "message" => $e->getMessage()
            ];
        }

    }
    
    public function updateStoreWithLogo($store_id, $store_name, $store_description, $store_logo_path = null)
    {
        try {
            if ($store_logo_path) {
                $stmt = $this->conn->prepare("
                UPDATE stores 
                SET store_name = :store_name, 
                    store_description = :store_description, 
                    store_logo_path = :store_logo_path 
                WHERE store_id = :store_id
            ");

                $stmt->execute([
                    "store_name" => $store_name,
                    "store_description" => $store_description,
                    "store_logo_path" => $store_logo_path,
                    "store_id" => $store_id
                ]);
            } else {
                $stmt = $this->conn->prepare("
                UPDATE stores 
                SET store_name = :store_name, 
                    store_description = :store_description
                WHERE store_id = :store_id
            ");

                $stmt->execute([
                    "store_name" => $store_name,
                    "store_description" => $store_description,
                    "store_id" => $store_id
                ]);
            }

            return $stmt->fetch();
        } catch (PDOException $e) {
            return false;
        }
    }
}

        // try {
        //     $this->conn->beginTransaction();

        //     // Insert ke tabel products
        //     $stmt = $this->conn->prepare("
        //     INSERT INTO products (
        //         store_id, product_name, description, price, stock, main_image_path, created_at, updated_at
        //     ) VALUES (
        //         :store_id, :product_name, :description, :price, :stock, :main_image_path, NOW(), NOW()
        //     )
        //     RETURNING product_id
        // ");
        //     $stmt->execute([
        //         ':store_id' => $store_id,
        //         ':product_name' => $product_name,
        //         ':description' => $description,
        //         ':price' => $price,
        //         ':stock' => $stock,
        //         ':main_image_path' => $main_image_path
        //     ]);

        //     $product_id = $stmt->fetchColumn();

        //     // Insert ke category_items jika ada kategori
        //     if (!empty($categories)) {
        //         $catStmt = $this->conn->prepare("
        //         INSERT INTO category_items (category_id, product_id)
        //         VALUES (:category_id, :product_id)
        //     ");

        //         foreach ($categories as $cat_id) {
        //             $catStmt->execute([
        //                 ':category_id' => $cat_id,
        //                 ':product_id' => $product_id
        //             ]);
        //         }
        //     }

        //     $this->conn->commit();
        //     return $product_id;
        // } catch (PDOException $e) {
        //     $this->conn->rollBack();
        //     error_log("Error saat membuat produk: " . $e->getMessage());
        //     return false;
        // }
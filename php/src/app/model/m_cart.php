<?php
require_once __DIR__ . '/../db/db.php';

class Cart
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function getAll()
    {
        $stmt = $this->conn->prepare("SELECT * FROM cart_items");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM cart_items WHERE id=:id");
        $stmt->execute([':cart_item_id' => $id]);
        return $stmt->fetch();
    }

    public function getByBuyer($buyer_id)
    {
        $sql = "
            SELECT 
                ci.cart_item_id,
                p.store_id,
                s.store_name,
                ci.product_id,
                p.product_name,
                p.stock,
                ci.quantity,
                p.price,
                (ci.quantity * p.price) AS total_item,
                p.main_image_path AS product_image
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            JOIN stores s ON p.store_id = s.store_id
            WHERE ci.buyer_id = :buyer_id
            ORDER BY p.store_id;
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':buyer_id' => $buyer_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Kelompokkan hasil berdasarkan store_id
        $grouped = [];
        foreach ($rows as $row) {
            $store_id = $row['store_id'];

            if (!isset($grouped[$store_id])) {
                $grouped[$store_id] = [
                    'store_id' => $store_id,
                    'store_name' => $row['store_name'],
                    'subtotal' => 0,
                    'items' => []
                ];
            }

            $grouped[$store_id]['items'][] = [
                'cart_item_id' => $row['cart_item_id'],
                'product_id' => $row['product_id'],
                'product_name' => $row['product_name'],
                'stock' => (int)$row['stock'],
                'quantity' => (int)$row['quantity'],
                'price' => (float)$row['price'],
                'total' => (float)$row['total_item'],
                'image' => $row['product_image']
            ];

            $grouped[$store_id]['subtotal'] += (float)$row['total_item'];
        }

        return [
            'buyer_id' => (int)$buyer_id,
            'stores' => array_values($grouped)
        ];
    }

    public function getByStoreAndBuyer($buyer_id, $store_id)
    {
        $sql = "
            SELECT 
                ci.cart_item_id,
                p.store_id,
                s.store_name,
                ci.product_id,
                p.product_name,
                p.stock,
                ci.quantity,
                p.price,
                (ci.quantity * p.price) AS total_item,
                p.main_image_path AS product_image
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            JOIN stores s ON p.store_id = s.store_id
            WHERE ci.buyer_id = :buyer_id AND p.store_id = :store_id
            ORDER BY ci.cart_item_id;
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':buyer_id' => $buyer_id,
            ':store_id' => $store_id
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) {
            return null;
        }

        // info toko dari row pertama
        $store_info = [
            'store_id' => $rows[0]['store_id'],
            'store_name' => $rows[0]['store_name'],
            'subtotal' => 0,
            'items' => []
        ];

        foreach ($rows as $row) {
            $store_info['items'][] = [
                'cart_item_id' => $row['cart_item_id'],
                'product_id' => $row['product_id'],
                'product_name' => $row['product_name'],
                'stock' => (int)$row['stock'],
                'quantity' => (int)$row['quantity'],
                'price' => (float)$row['price'],
                'total' => (float)$row['total_item'],
                'image' => $row['product_image']
            ];

            $store_info['subtotal'] += (float)$row['total_item'];
        }

        return [
            'buyer_id' => (int)$buyer_id,
            'store' => $store_info
        ];
    }

    public function getStoreIdByCartItem($cart_item_id)
    {
        $stmt = $this->conn->prepare("
            SELECT p.store_id 
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_item_id = :cart_item_id
        ");
        $stmt->execute([':cart_item_id' => $cart_item_id]);
        $result = $stmt->fetch();
        return $result ? (int)$result['store_id'] : null;
    }

    public function getBuyerIdByCartItem($cart_item_id)
    {
        $stmt = $this->conn->prepare("
            SELECT buyer_id 
            FROM cart_items
            WHERE cart_item_id = :cart_item_id
        ");
        $stmt->execute([':cart_item_id' => $cart_item_id]);
        $result = $stmt->fetch();
        return $result ? (int)$result['buyer_id'] : null;
    }

    public function addToCart($buyer_id, $product_id, $quantity)
    {
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO cart_items (buyer_id, product_id, quantity)
                VALUES (:buyer_id, :product_id, :quantity)
                ON CONFLICT (buyer_id, product_id) 
                DO UPDATE SET 
                    quantity = cart_items.quantity + EXCLUDED.quantity
            ");

            $success = $stmt->execute([
                "buyer_id" => $buyer_id,
                "product_id" => $product_id,
                "quantity" => $quantity
            ]);

            if ($success) {
                return [
                    "status" => "success",
                    "message" => "Product added to cart",
                    "id" => $this->conn->lastInsertId()
                ];
            } else {
                return [
                    "status" => "error",
                    "message" => "Insert failed for unknown reason"
                ];
            }
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }

    public function removeFromCart($cart_item_id)
    {
        $stmt = $this->conn->prepare("DELETE FROM cart_items WHERE cart_item_id = :cart_item_id");
        $success = $stmt->execute([':cart_item_id' => $cart_item_id]);
        return [
            'status' => $success ? 'success' : 'error',
            'message' => $success ? 'Item removed from cart' : 'Failed to remove item from cart'
        ];
    }

    public function removeStoreFromCart($buyer_id, $store_id)
    {
        $stmt = $this->conn->prepare("
            DELETE FROM cart_items
            WHERE buyer_id = :buyer_id 
            AND product_id IN (
                SELECT product_id 
                FROM products 
                WHERE store_id = :store_id
            )
        ");
        $result = $stmt->execute([
            ':buyer_id' => $buyer_id,
            ':store_id' => $store_id
        ]);
        return [
            'status' => $result ? 'success' : 'error',
            'message' => $result ? 'Store items removed from cart' : 'Failed to remove store items from cart'
        ];
    }

    public function clearBuyerCart($buyer_id)
    {
        $stmt = $this->conn->prepare("DELETE FROM cart_items WHERE buyer_id = :buyer_id");
        return $stmt->execute([':buyer_id' => $buyer_id]);
    }



    public function increamentQuantity($cart_item_id, $amount)
    {
        $amount = (int)$amount;
        if ($amount <= 0) {
            return false;
        }

        $stmt = $this->conn->prepare("UPDATE cart_items SET quantity = quantity + :amount WHERE cart_item_id = :cart_item_id");
        return $stmt->execute([
            ':amount' => $amount,
            ':cart_item_id' => $cart_item_id
        ]);
    }

    public function getQuantity($cart_item_id)
    {
        $stmt = $this->conn->prepare("SELECT quantity FROM cart_items WHERE cart_item_id = :cart_item_id");
        $stmt->execute([':cart_item_id' => $cart_item_id]);
        $result = $stmt->fetch();
        return $result ? (int)$result['quantity'] : 0;
    }

    public function decreamentQuantity($cart_item_id, $amount)
    {
        $amount = (int)$amount;
        if ($amount <= 0) {
            return false;
        }

        $total = $this->getQuantity($cart_item_id);

        if ($total <= 1 || $total - $amount <= 0) {
            return $this->removeFromCart($cart_item_id);  // ✅ return hasil
        }

        $stmt = $this->conn->prepare("UPDATE cart_items SET quantity = quantity - :amount WHERE cart_item_id = :cart_item_id");
        return $stmt->execute([
            ':amount' => $amount,
            ':cart_item_id' => $cart_item_id
        ]);
    }

    public function getQuantityByBuyer($buyer_id)
    {
        $stmt = $this->conn->prepare("SELECT SUM(quantity) AS total_quantity FROM cart_items WHERE buyer_id = :buyer_id");
        $stmt->execute([':buyer_id' => $buyer_id]);
        $result = $stmt->fetch();
        return $result ? (int)$result['total_quantity'] : 0;
    }

    public function getTotalPrice($buyer_id)
    {
        $stmt = $this->conn->prepare("
            SELECT SUM(p.price * c.quantity) AS total_price
            FROM cart_items c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.buyer_id = :buyer_id
        ");
        $stmt->execute([':buyer_id' => $buyer_id]);
        $result = $stmt->fetch();
        return $result ? (float)$result['total_price'] : 0.0;
    }

    public function getSummary($buyer_id)
    {
        $total_price = $this->getTotalPrice($buyer_id);
        $total_quantity = $this->getQuantityByBuyer($buyer_id);
        $subtotal = $this->conn->prepare("
            SELECT s.store_id, s.store_name AS store_name, SUM(p.price * c.quantity) AS subtotal
            FROM cart_items c
            JOIN products p ON c.product_id = p.product_id
            JOIN stores s ON p.store_id = s.store_id
            WHERE c.buyer_id = :buyer_id
            GROUP BY s.store_id, s.store_name
        ");
        $subtotal->execute([':buyer_id' => $buyer_id]);
        $subtotal_result = $subtotal->fetchall();

        return [
            'buyer_id' => $buyer_id,
            'total_price' => $total_price,
            'total_quantity' => $total_quantity,
            'subtotal' => $subtotal_result
        ];
    }

    public function checkout($buyer_id, $shipping_address)
    {
        try {
            // Mulai transaksi
            $this->conn->beginTransaction();

            // 1. Ambil cart buyer
            $cart = $this->getByBuyer($buyer_id);
            if (empty($cart['stores'])) {
                throw new Exception("Cart kosong");
            }

            // 2. Hitung total harga semua store
            $total_price = 0;
            foreach ($cart['stores'] as $store) {
                $total_price += $store['subtotal'];
            }

            // 3. Cek saldo buyer
            $stmt = $this->conn->prepare("SELECT balance FROM users WHERE user_id = :buyer_id FOR UPDATE");
            $stmt->execute([':buyer_id' => $buyer_id]);
            $balance = $stmt->fetchColumn();
            if ($balance < $total_price) {
                throw new Exception("Saldo tidak cukup");
            }

            // 4. Cek stok tiap item
            foreach ($cart['stores'] as $store) {
                foreach ($store['items'] as $item) {
                    $stmt = $this->conn->prepare("SELECT stock FROM products WHERE product_id = :product_id FOR UPDATE");
                    $stmt->execute([':product_id' => $item['product_id']]);
                    $stock = $stmt->fetchColumn();
                    if ($stock < $item['quantity']) {
                        throw new Exception("Stok tidak cukup untuk produk: " . $item['product_name']);
                    }
                }
            }

            // 5. Kurangi stok tiap item
            foreach ($cart['stores'] as $store) {
                foreach ($store['items'] as $item) {
                    $stmt = $this->conn->prepare("
                    UPDATE products 
                    SET stock = stock - :quantity 
                    WHERE product_id = :product_id
                ");
                    $stmt->execute([
                        ':quantity' => $item['quantity'],
                        ':product_id' => $item['product_id']
                    ]);
                }
            }

            // 6. Buat order per store
            foreach ($cart['stores'] as $store) {
                $stmt = $this->conn->prepare("
                INSERT INTO orders (buyer_id, store_id, total_price, shipping_address, status, created_at)
                VALUES (:buyer_id, :store_id, :total_price, :shipping_address, 'waiting_approval', NOW())
                RETURNING order_id
            ");
                $stmt->execute([
                    ':buyer_id' => $buyer_id,
                    ':store_id' => $store['store_id'],
                    ':total_price' => $store['subtotal'],
                    ':shipping_address' => $shipping_address
                ]);
                $order_id = $stmt->fetchColumn();

                // 7. Masukkan order_items dengan subtotal
                foreach ($store['items'] as $item) {
                    $subtotal_item = $item['quantity'] * $item['price'];
                    $stmt = $this->conn->prepare("
                    INSERT INTO order_items (order_id, product_id, quantity, price_at_order, subtotal)
                    VALUES (:order_id, :product_id, :quantity, :price, :subtotal)
                ");
                    $stmt->execute([
                        ':order_id' => $order_id,
                        ':product_id' => $item['product_id'],
                        ':quantity' => $item['quantity'],
                        ':price' => $item['price'],
                        ':subtotal' => $subtotal_item
                    ]);
                }
            }

            // 8. Kurangi saldo buyer
            $stmt = $this->conn->prepare("
            UPDATE users 
            SET balance = balance - :total_price 
            WHERE user_id = :buyer_id
        ");
            $stmt->execute([
                ':total_price' => $total_price,
                ':buyer_id' => $buyer_id
            ]);

            // 9. Hapus semua cart buyer
            $this->clearBuyerCart($buyer_id);

            // Commit transaksi
            $this->conn->commit();

            return [
                'status' => 'success',
                'message' => 'Checkout berhasil',
                'redirect' => '/order-history'
            ];
        } catch (Exception $e) {
            // Rollback jika error
            $this->conn->rollBack();
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}

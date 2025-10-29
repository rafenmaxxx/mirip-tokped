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

        // Kembalikan sebagai array numerik
        return array_values($grouped);
    }

    public function addToCart($buyer_id, $product_id, $quantity)
    {
        try {
            $stmt = $this->conn->prepare("
            INSERT INTO cart_items (buyer_id, product_id, quantity)
            VALUES (:buyer_id, :product_id, :quantity)
        ");

            $success = $stmt->execute([
                "buyer_id" => $buyer_id,
                "product_id" => $product_id,
                "quantity" => $quantity
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

    public function removeFromCart($cart_item_id)
    {
        $stmt = $this->conn->prepare("DELETE FROM cart_items WHERE id = :cart_item_id");
        return $stmt->execute([':cart_item_id' => $cart_item_id]);
    }

    public function clearBuyerCart($buyer_id)
    {
        $stmt = $this->conn->prepare("DELETE FROM cart_items WHERE buyer_id = :buyer_id");
        return $stmt->execute([':buyer_id' => $buyer_id]);
    }
    
    

    public function increamentQuantity($cart_item_id, $amount)
    {
        if ($amount <= 0) {
            return false; 
        }
        
        $stmt = $this->conn->prepare("UPDATE cart_items SET quantity = quantity + :amount WHERE id = :cart_item_id");
        return $stmt->execute([
            ':amount' => $amount,
            ':cart_item_id' => $cart_item_id
        ]);
    }
    
    public function decreamentQuantity($cart_item_id, $amount)
    {   
        if ($amount <= 0) {
            return false; 
        }

        $total = $this->getTotalQuantity($cart_item_id);

        if ($total <= 0) {
            $stmt = $this->removeFromCart($cart_item_id);
            return;
        }

        $stmt = $this->conn->prepare("UPDATE cart_items SET quantity = quantity - :amount WHERE id = :cart_item_id");
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

    public function getTotal($buyer_id)
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
}

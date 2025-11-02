<?php
require_once __DIR__ . '/../db/db.php';

class User
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    /* Hash password menggunakan bcrypt */
    private function hashPassword($password)
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }


    public function createUser($name, $email, $password, $address, $role, $balance)
    {
        try {
            
            $hashedPassword = $this->hashPassword($password);

            $stmt = $this->conn->prepare("
                INSERT INTO users (email, password, role, name, address, balance)
                VALUES (:email, :password, :role, :name, :address, :balance)
            ");

            $success = $stmt->execute([
                "email" => $email,
                "password" => $hashedPassword,
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

    public function addBalance($user_id, $value)
    {
        $stmt = $this->conn->prepare("UPDATE users SET balance = balance + :val WHERE user_id = :id");
        $stmt->execute([":id" => $user_id, ":val" => $value]);
        return $stmt->fetch();
    }

    public function addBalanceByStoreId($store_id, $value)
    {
        try {

            $stmt = $this->conn->prepare("SELECT user_id FROM stores WHERE store_id = :store_id");
            $stmt->execute([':store_id' => $store_id]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$res) {
                throw new Exception("Store dengan ID $store_id tidak ditemukan");
            }

            $user_id = $res['user_id'];


            $updateStmt = $this->conn->prepare("UPDATE users SET balance = balance + :val, updated_at = NOW() WHERE user_id = :user_id");
            $updateStmt->execute([
                ':val' => $value,
                ':user_id' => $user_id
            ]);

            return $updateStmt->rowCount();
        } catch (PDOException $e) {
            error_log("Error saat menambahkan balance: " . $e->getMessage());
            return false;
        }
    }

    public function getBalance($user_id)
    {
        $stmt = $this->conn->prepare("SELECT balance FROM users WHERE user_id = :id");
        $stmt->execute([":id" => $user_id]);
        return $stmt->fetch();
    }

    public function getAll()
    {
        $stmt = $this->conn->prepare("SELECT * FROM users");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE user_id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function getAddressById($id)
    {
        $stmt = $this->conn->prepare("SELECT address FROM users WHERE user_id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function updateUser($id, $new_name = null, $new_address = null, $new_password = null)
    {
        $fields = [];
        $params = [':id' => $id];


        $updates = [
            'name' => $new_name,
            'address' => $new_address,
            'password' => $new_password
        ];


        foreach ($updates as $field => $value) {
            if (!is_null($value) && $value !== '') {
                
                if ($field === 'password') {
                    $value = $this->hashPassword($value);
                }
                
                $fields[] = "$field = :$field";
                $params[":$field"] = $value;
            }
        }


        if (empty($fields)) {
            return $this->getById($id);
        }

        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE user_id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        return $this->getById($id);
    }
}

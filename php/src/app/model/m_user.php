<?php
require_once __DIR__ . '/../db/db.php';

class User
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function createUser($name, $email, $password, $address, $role, $balance)
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
}

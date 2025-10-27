<?php
require_once __DIR__ . '/../db/db.php';

class Auth
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function login($email, $password)
    {
        try {
            $stmt = $this->conn->prepare("
            SELECT user_id, email, password, role 
            FROM users 
            WHERE email = :email
            LIMIT 1
        ");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return ["status" => false, "message" => "Email tidak ditemukan"];
            }

            if ($password != $user['password']) {
                return ["status" => false, "message" => "Password salah"];
            }


            $_SESSION['user'] = [
                'id' => $user['user_id'],
                'email' => $user['email'],
                'role' => $user['role']
            ];

            return [
                "status" => true,
                "user" => [
                    "id" => $user['user_id'],
                    "email" => $user['email'],
                    "role" => $user['role']
                ]
            ];
        } catch (PDOException $e) {
            return ["status" => false, "message" => $e->getMessage()];
        }
    }


    public function logout()
    {

        session_unset();
        session_destroy();

        return [
            "status" => true,
            "message" => "Logout berhasil"
        ];
    }

    public function check()
    {

        if (isset($_SESSION['user'])) {
            return $_SESSION['user'];
        } else {
            return "";
        }
    }
}

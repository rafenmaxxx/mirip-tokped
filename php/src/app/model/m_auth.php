<?php
require_once __DIR__ . '/../db/db.php';

function guard(array $allowed)
{
    $isGuestAllowed = in_array("GUEST", $allowed);

    if (!isset($_SESSION['user'])) {
        if ($isGuestAllowed) {

            return;
        } else {

            echo "<script>
                    alert('Login dulu Bos!');
                    window.location.href = '/login';
                  </script>";
            exit;
        }
    }

    if ($isGuestAllowed) {
        echo "<script>
                alert('Kamu sudah login Bos!');
                window.location.href = '/';
              </script>";
        exit;
    }

    $role = $_SESSION['user']['role'] ?? null;
    if (!in_array($role, $allowed)) {
        echo "<script>
                alert('Kamu tidak punya akses ke API ini!');
                window.location.href = '/login';
              </script>";
        exit;
    }
}


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


            $store_id = null;


            if (strtolower($user['role']) === 'seller') {
                $stmtStore = $this->conn->prepare(query: "
                SELECT store_id 
                FROM stores 
                WHERE user_id = :user_id
                LIMIT 1
            ");
                $stmtStore->execute(['user_id' => $user['user_id']]);
                $store = $stmtStore->fetch(PDO::FETCH_ASSOC);

                if ($store) {
                    $store_id = $store['store_id'];
                }
            }

            $_SESSION['user'] = [
                'id' => $user['user_id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'store_id' => $store_id
            ];

            return [
                "status" => true,
                "user" => [
                    "id" => $user['user_id'],
                    "email" => $user['email'],
                    "role" => $user['role'],
                    "store_id" => $store_id
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

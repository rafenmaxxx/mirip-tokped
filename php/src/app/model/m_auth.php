<?php
require_once __DIR__ . '/../db/db.php';

function guard(array $allowed)
{
    $isGuestAllowed = in_array("GUEST", $allowed);

    if (!isset($_SESSION['user'])) {
        if ($isGuestAllowed) {

            return;
        } else {

            warn("Login dulu bos", "/login");
            exit;
        }
    }

    if ($isGuestAllowed) {
        warn("Kamu sudah login Bos!", "/");
        exit;
    }

    $role = $_SESSION['user']['role'] ?? null;
    if (!in_array($role, $allowed)) {
        echo "<script>
                alert('Kamu tidak punya akses ke API ini!');
                window.location.href = '/login';
              </script>";

        warn("Kamu sudah login Bos!", "/");
        exit;
    }
}

function warn($message, $href)
{
    $publicCssPath = '/css/general/style_alert.css';
    echo "
    <link rel='stylesheet' href='" . htmlspecialchars($publicCssPath) . "' />

    <div class='custom-alert-overlay' id='customAlert'>
        <div class='custom-alert-box'>
            <div class='alert-title'>Peringatan</div>
            <div class='alert-message'>" . htmlspecialchars($message) . "</div>
            <button class='alert-btn' id='alertOkBtn'>Mengerti</button>
        </div>
    </div>

    <script>
        document.getElementById('alertOkBtn').addEventListener('click', function() {
            const overlay = document.getElementById('customAlert');
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s ease';
            setTimeout(() => {
                window.location.href = '" . addslashes($href) . "';
            }, 200);
        });
    </script>
    ";
}



class Auth
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function verifyPassword($password, $hashedPassword)
    {
        return password_verify($password, $hashedPassword);
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
                if (!$this->verifyPassword($password, $user['password'])) {
                    return ["status" => false, "message" => "Password salah"];
                }
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

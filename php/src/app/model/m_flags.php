<?php
require_once __DIR__ . '/../db/db.php';

class FeatureFlags
{
    private $conn;

    public function __construct()
    {
        $db = Database::getInstance();
        $this->conn = $db->getConnection();
    }

    public function isAllowedCheckout($userId)
    {
        try {
            $stmt = $this->conn->prepare("
                SELECT is_enabled, reason 
                FROM user_feature_access 
                WHERE feature_name = 'checkout_enabled' AND user_id = :user_id
            ");
            $stmt->execute(['user_id' => $userId]);
            $userFlag = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($userFlag) {
                return [
                    'isAllowed' => $userFlag['is_enabled'],
                    'reason' => $userFlag['reason']
                ];
            }

            $stmt = $this->conn->prepare("
                SELECT is_enabled, reason 
                FROM user_feature_access 
                WHERE feature_name = 'checkout_enabled' AND user_id IS NULL
            ");
            $stmt->execute();
            $globalFlag = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$globalFlag) {
                return ['isAllowed' => true, 'reason' => null];
            }

            return [
                'isAllowed' => $globalFlag['is_enabled'],
                'reason' => $globalFlag['reason']
            ];
        } catch (PDOException $e) {
            error_log("Feature flag check error: " . $e->getMessage());
            return ['isAllowed' => false, 'reason' => 'Terjadi kesalahan sistem'];
        }
    }
}

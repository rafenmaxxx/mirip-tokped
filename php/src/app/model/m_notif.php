<?php

class M_Notif
{

    private $baseUrl = "http://nginx/node/api";



    private function fetch($url)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);

        $result = curl_exec($ch);

        // Log untuk debugging
        if (curl_errno($ch)) {
            error_log("CURL Error in M_Notif::fetch: " . curl_error($ch) . " | URL: " . $url);
        } else {
            error_log("M_Notif::fetch Response: " . $result . " | URL: " . $url);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("HTTP Error: " . $httpCode . " for URL: " . $url);
            return null;
        }

        return json_decode($result, true);
    }

    private function post($url, $data)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);

        $result = curl_exec($ch);

        // Log untuk debugging
        if (curl_errno($ch)) {
            error_log("CURL Error in M_Notif::post: " . curl_error($ch) . " | URL: " . $url);
        } else {
            error_log("M_Notif::post Response: " . $result . " | URL: " . $url . " | Data: " . json_encode($data));
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("HTTP Error: " . $httpCode . " for URL: " . $url);
            return null;
        }

        return json_decode($result, true);
    }

    public function isAllowedOrderNotif($userId)
    {
        $url = $this->baseUrl . "/push-preferences/user/" . $userId;
        error_log("Checking notification permission for user: " . $userId);

        $response = $this->fetch($url);

        if ($response === null) {
            error_log("Failed to fetch notification preferences for user: " . $userId);
            return false;
        }

        error_log("Notification preferences response: " . json_encode($response));

        if (isset($response['status']) && $response['status'] === 'success') {
            $enabled = $response['data']['order_enabled'] ?? false;
            error_log("Notification enabled for user {$userId}: " . ($enabled ? 'YES' : 'NO'));
            return $enabled;
        }

        error_log("Invalid response format for user: " . $userId);
        return false;
    }
    public function sendNotifikasi($userId, $payload)
    {
        $url = $this->baseUrl . "/notif/send/user/" . $userId;
        $response = $this->post($url, $payload);

        return $response;
    }
}

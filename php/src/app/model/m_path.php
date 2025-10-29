<?php

class Path
{
    private $routes;

    public function __construct($jsonPath =  __DIR__ . '/../../data/route/route.json')
    {

        if (!file_exists($jsonPath)) {
            throw new Exception("Route file not found: " . $jsonPath);
        }

        $content = file_get_contents($jsonPath);
        $this->routes = json_decode($content, true);

        if ($this->routes === null) {
            throw new Exception("Invalid JSON in route file.");
        }
    }

    public function getAll()
    {
        return $this->routes;
    }

    public function getPath($path)
    {

        $data = $this->routes[$path] ?? null;
        if (!$data) return null;

        $access = $data['access'] ?? [];

        if (isset($_SESSION['user'])) {
            $role = $_SESSION['user']['role'];
            return in_array($role, $access) ? $data : null;
        } else {

            return in_array('GUEST', $access) ? $data : null;
        }
    }
}

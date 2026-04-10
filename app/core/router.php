<?php
namespace App\Core;

class Router {
    private $routes;

    public function __construct($routes) {
        $this->routes = $routes;
    }

    // Cette méthode transforme "/produit/{id}" en une Regex utilisable
    private function convertPathToRegex($path) {
        return '#^' . preg_replace('/\{(\w+)\}/', '(?P<\1>[^/]+)', $path) . '$#';
    }

    private function getSessionRole(): ?string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return $_SESSION['role'] ?? null;
    }

    private function enforcePageAccess(string $method, string $uri): void {
        // Ne filtrer que les pages applicatives, pas les endpoints API.
        if ($method !== 'GET' || str_starts_with($uri, '/api/')) {
            return;
        }

        // Pages publiques
        if (in_array($uri, ['/', '/login'], true)) {
            return;
        }

        $role = $this->getSessionRole();
        if ($role === null) {
            $this->abort(401);
        }

        // Le profil surveillant ne peut accéder qu'à scanner, encodage manuel et déconnexion.
        if ($role === 'surveillant') {
            $allowed = ['/scan', '/manualEncoding', '/logout'];
            if (!in_array($uri, $allowed, true)) {
                $this->abort(403);
            }
            return;
        }

        // Le profil administration n'a pas accès à la gestion.
        if ($role === 'administration' && in_array($uri, ['/management', '/gestion'], true)) {
            $this->abort(403);
        }
    }

    private function enforceApiAccess(string $method, string $uri): void {
        if (!str_starts_with($uri, '/api/')) {
            return;
        }

        // Endpoints API publics (avant session)
        if (
            ($uri === '/api/login' && $method === 'POST') ||
            ($uri === '/api/logout' && ($method === 'GET' || $method === 'POST'))
        ) {
            return;
        }

        $role = $this->getSessionRole();
        if ($role === null) {
            $this->abort(401);
        }

        if ($role === 'surveillant') {
            // Le surveillant doit pouvoir scanner et encoder manuellement uniquement.
            $isAllowed = false;

            if ($uri === '/api/scan' && $method === 'POST') {
                $isAllowed = true;
            }
            if ($uri === '/api/movements/add' && $method === 'POST') {
                $isAllowed = true;
            }
            if ($uri === '/api/movements' && $method === 'GET') {
                $isAllowed = true;
            }
            if ($uri === '/api/students' && $method === 'GET') {
                $isAllowed = true;
            }
            if (preg_match('#^/api/schedules/[^/]+$#', $uri) === 1 && $method === 'GET') {
                $isAllowed = true;
            }

            if (!$isAllowed) {
                $this->abort(403);
            }
            return;
        }

        if ($role === 'administration') {
            // Bloquer les endpoints sensibles de gestion avancée.
            $isDenied =
                str_starts_with($uri, '/api/users') ||
                in_array($uri, ['/api/students/add', '/api/students/update', '/api/students/delete'], true) ||
                in_array($uri, ['/api/movements/update', '/api/movements/delete'], true) ||
                in_array($uri, ['/api/schedules/add', '/api/schedules/update', '/api/schedules/delete'], true);

            if ($isDenied) {
                $this->abort(403);
            }
        }
    }

    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        $this->enforcePageAccess($method, $uri);
        $this->enforceApiAccess($method, $uri);

        if (!isset($this->routes[$method])) {
            $this->abort(405);
        }

        // On parcourt toutes les routes de la méthode demandée (GET, POST...)
        foreach ($this->routes[$method] as $routePath => $handler) {
            
            // On convertit la route en Regex
            $regex = $this->convertPathToRegex($routePath);

            // On compare l'URL du navigateur avec la Regex
            if (preg_match($regex, $uri, $matches)) {
                
                // On extrait les paramètres (ex: ['id' => '12'])
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                [$controllerName, $action] = $handler;
                $controllerPath = "App\\Controller\\" . $controllerName;

                if (class_exists($controllerPath)) {
                    $controller = new $controllerPath();
                    
                    // ON PASSE LES PARAMÈTRES À LA MÉTHODE DU CONTRÔLEUR
                    $controller->$action($params);
                    return;
                }
            }
        }

        $this->abort(404);
    }

    private function abort($code) {
        http_response_code($code);
        echo json_encode(['error' => "Erreur $code"]);
        exit;
    }
}

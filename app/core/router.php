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

    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

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
                $controllerPath = "App\\Controllers\\" . $controllerName;

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

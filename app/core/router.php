<?php
namespace App\Core;

use App\Service\CsrfService;

/**
 * Routeur frontal de l'application.
 *
 * Associe chaque combinaison méthode HTTP + chemin URI à un contrôleur et une action,
 * et applique les règles de contrôle d'accès selon le rôle de l'utilisateur connecté.
 */
class Router {
    private $routes;

    private function getClientIp(): string {
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            $value = $_SERVER[$header] ?? '';
            if (!is_string($value) || $value === '') {
                continue;
            }

            $ip = trim(explode(',', $value)[0]);
            if ($ip !== '') {
                return $ip;
            }
        }

        return '0.0.0.0';
    }

    private function logUnauthorizedAccess(string $reason, string $method, string $uri): void {
        $role = $this->getSessionRole() ?? 'guest';
        $ip = $this->getClientIp();
        error_log(sprintf(
            '[SECURITY] Access denied: reason=%s method=%s uri=%s role=%s ip=%s',
            $reason,
            $method,
            $uri,
            $role,
            $ip
        ));
    }

    private function getCsrfTokenFromHeaders(): ?string {
        $token = null;

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (is_array($headers)) {
                foreach ($headers as $name => $value) {
                    if (!is_string($name)) {
                        continue;
                    }

                    $normalized = strtolower($name);
                    if ($normalized === 'x-csrf-token' || $normalized === 'x-csrftoken') {
                        $token = is_string($value) ? $value : null;
                        break;
                    }
                }
            }
        }

        if (!is_string($token) || $token === '') {
            $serverToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
            $token = is_string($serverToken) ? $serverToken : null;
        }

        return $token;
    }

    private function getCsrfTokenFromRequestBody(): ?string {
        $postToken = $_POST['csrf_token'] ?? null;
        if (is_string($postToken) && $postToken !== '') {
            return $postToken;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (!is_string($contentType) || stripos($contentType, 'application/json') === false) {
            return null;
        }

        $rawBody = file_get_contents('php://input');
        if (!is_string($rawBody) || trim($rawBody) === '') {
            return null;
        }

        $decoded = json_decode($rawBody, true);
        $bodyToken = is_array($decoded) ? ($decoded['csrf_token'] ?? null) : null;
        return is_string($bodyToken) && $bodyToken !== '' ? $bodyToken : null;
    }

    private function enforceCsrfProtection(string $method, string $uri): void {
        $stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!in_array($method, $stateChangingMethods, true)) {
            return;
        }

        if (!str_starts_with($uri, '/api/')) {
            return;
        }

        // Endpoints exclus du contrôle CSRF.
        // login/csrf-token sont publics ; scan/logout sont déjà protégés par session + rôle.
        if (in_array($uri, ['/api/login', '/api/csrf-token', '/api/scan', '/api/logout'], true)) {
            return;
        }

        $token = $this->getCsrfTokenFromHeaders();
        if (!is_string($token) || $token === '') {
            $token = $this->getCsrfTokenFromRequestBody();
        }
        if (!CsrfService::validateToken($token)) {
            $this->logUnauthorizedAccess('csrf_invalid', $method, $uri);
            $this->abort(403, 'Token CSRF invalide');
        }
    }

    /**
     * @param array $routes Tableau de routes indexé par méthode HTTP
     *                      (ex : ['GET' => ['/path' => ['Controller', 'action']]])
     */
    public function __construct($routes) {
        $this->routes = $routes;
    }

    /**
     * Convertit un chemin paramétré ("/produit/{id}") en expression régulière.
     *
     * @param string $path Chemin avec paramètres entre accolades
     * @return string Expression régulière utilisable avec preg_match()
     */
    // Cette méthode transforme "/produit/{id}" en une Regex utilisable
    private function convertPathToRegex($path) {
        return '#^' . preg_replace('/\{(\w+)\}/', '(?P<\1>[^/]+)', $path) . '$#';
    }

    /**
     * Retourne le rôle de l'utilisateur actuellement en session, ou null si non connecté.
     *
     * @return string|null
     */
    private function getSessionRole(): ?string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return $_SESSION['role'] ?? null;
    }

    /**
     * Vérifie si le rôle correspond à un Gestionnaire.
     *
     * @param string|null $role
     * @return bool
     */
    private function isGestionnaireRole(?string $role): bool {
        return $role === 'Gestionnaire';
    }

    /**
     * Applique les règles d'accès pour les pages applicatives (requêtes GET non-API).
     * Redirige avec abort(401/403) si l'accès est interdit.
     *
     * @param string $method Méthode HTTP
     * @param string $uri    Chemin URI (sans query string)
     * @return void
     */
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
            $this->logUnauthorizedAccess('page_unauthenticated', $method, $uri);
            $this->abort(401);
        }

        // Le profil Surveillant ne peut acceder qu'a scanner, encodage manuel et deconnexion.
        if ($role === 'Surveillant') {
            $allowed = ['/scan', '/manualEncoding', '/logout'];
            if (!in_array($uri, $allowed, true)) {
                $this->logUnauthorizedAccess('page_forbidden_surveillant', $method, $uri);
                $this->abort(403);
            }
            return;
        }

        // Le profil Gestionnaire n'a pas acces a la gestion.
        if ($this->isGestionnaireRole($role) && in_array($uri, ['/management', '/gestion'], true)) {
            $this->logUnauthorizedAccess('page_forbidden_gestionnaire', $method, $uri);
            $this->abort(403);
        }
    }

    /**
     * Applique les règles d'accès pour les endpoints API (/api/*).
     * Redirige avec abort(401/403) si l'accès est interdit.
     *
     * @param string $method Méthode HTTP
     * @param string $uri    Chemin URI
     * @return void
     */
    private function enforceApiAccess(string $method, string $uri): void {
        if (!str_starts_with($uri, '/api/')) {
            return;
        }

        // Endpoints API publics (avant session)
        if (
            ($uri === '/api/login' && $method === 'POST') ||
            ($uri === '/api/csrf-token' && $method === 'GET') ||
            ($uri === '/api/logout' && ($method === 'GET' || $method === 'POST'))
        ) {
            return;
        }

        $role = $this->getSessionRole();
        if ($role === null) {
            $this->logUnauthorizedAccess('api_unauthenticated', $method, $uri);
            $this->abort(401);
        }

        if ($role === 'Surveillant') {
            // Le Surveillant doit pouvoir scanner et encoder manuellement uniquement.
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
                $this->logUnauthorizedAccess('api_forbidden_surveillant', $method, $uri);
                $this->abort(403);
            }
            return;
        }

        if ($this->isGestionnaireRole($role)) {
            // Bloquer les endpoints sensibles de gestion avancée.
            $isDenied =
                str_starts_with($uri, '/api/users') ||
                in_array($uri, ['/api/students/add', '/api/students/update', '/api/students/delete'], true) ||
                in_array($uri, ['/api/movements/update', '/api/movements/delete'], true) ||
                in_array($uri, ['/api/schedules/add', '/api/schedules/update', '/api/schedules/delete'], true) ||
                in_array($uri, ['/api/settings', '/api/settings/backups', '/api/settings/update', '/api/audits/logins', '/api/audits/db-changes'], true);

            if ($isDenied) {
                $this->logUnauthorizedAccess('api_forbidden_gestionnaire', $method, $uri);
                $this->abort(403);
            }
        }
    }

    /**
     * Exécute le routage : résout l'URI courante, vérifie les droits et appelle l'action du contrôleur.
     * Termine avec abort(404) si aucune route ne correspond, abort(405) si la méthode est invalide.
     *
     * @return void
     */
    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        $this->enforcePageAccess($method, $uri);
        $this->enforceApiAccess($method, $uri);
        $this->enforceCsrfProtection($method, $uri);

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

    /**
     * Envoie un code HTTP d'erreur avec un corps JSON et arrête l'exécution.
     *
     * @param int $code Code HTTP (ex : 401, 403, 404, 405)
     * @return never
     */
    private function abort($code, ?string $message = null) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message ?? "Erreur $code"]);
        exit;
    }
}

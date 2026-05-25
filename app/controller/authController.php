<?php
namespace App\Controller;

use App\Model\UsersModel;
use App\Service\CsrfService;
use App\Service\AuditService;
use App\Service\RateLimiterService;
use App\Service\SmartschoolSync;
use App\Service\SmartschoolWebServiceV3Client;
use App\Service\ValidationService;
use Exception;

class AuthController {
    private UsersModel $usersModel;
    private ?SmartschoolSync $smartschoolSync = null;

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

    public function __construct() {
        $this->usersModel = new UsersModel();
    }

    /**
     * Affiche la page de connexion
     */
    public function index() {
        require_once __DIR__ . '/../view/layout.php';
    }

    /**
     * API : Génère/retourne le token CSRF de session
     */
    public function csrfToken($params = []) {
        header('Content-Type: application/json');

        try {
            echo json_encode([
                'success' => true,
                'csrf_token' => CsrfService::getToken(),
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Impossible de générer le token CSRF',
            ]);
        }
    }

    /**
     * API : Vérifier l'authentification
     */
    public function verify($params = []) {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input) && isset($params['username']) && isset($params['password'])) {
                $input = ['username' => $params['username'], 'password' => $params['password']];
            }

            if (!$input || !isset($input['username']) || !isset($input['password'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Identifiants manquants'
                ]);
                exit;
            }

            // Valider les identifiants : longueur et format
            $username = $input['username'];
            $password = $input['password'];
            
            // Vérifier les longueurs (prévention DoS)
            if (!ValidationService::validateString($username, 3, 50)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Nom d\'utilisateur invalide (3-50 caractères)'
                ]);
                exit;
            }
            
            if (!ValidationService::validateString($password, 1, 128)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Mot de passe invalide'
                ]);
                exit;
            }

            // Rate limiting anti brute-force sur login
            $ip = $this->getClientIp();
            $limit = RateLimiterService::checkLogin($ip, $username);
            if (!$limit['allowed']) {
                http_response_code(429);
                echo json_encode([
                    'success' => false,
                    'message' => 'Trop de tentatives. Réessayez plus tard.',
                    'retry_after' => $limit['retry_after'],
                ]);
                exit;
            }

            $user = $this->usersModel->authenticate($username, $password);
            
            if ($user) {
                // Démarrer une session
                if (!isset($_SESSION)) {
                    session_start();
                }
                
                $_SESSION['user_id'] = $user['id_user'];
                $_SESSION['username'] = $user['nom'];
                $_SESSION['role'] = $user['role'];

                // Login réussi: reset du compteur de tentatives.
                RateLimiterService::clearFailures($ip, $username);

                // Rotation du token CSRF après élévation de privilège.
                CsrfService::rotateToken();

                // Audit de connexion réussie.
                AuditService::logLogin((string)($user['nom'] ?? $username), $ip);

                $syncResult = [
                    'executed' => false,
                    'success' => false,
                    'stats' => null,
                    'message' => ''
                ];

                try {
                    $syncMaxSeconds = 10;
                    $this->smartschoolSync ??= new SmartschoolSync(new SmartschoolWebServiceV3Client(null, 3));
                    if (method_exists($this->smartschoolSync, 'syncForLogin')) {
                        $stats = call_user_func([$this->smartschoolSync, 'syncForLogin'], false, $syncMaxSeconds);
                    } else {
                        $stats = $this->smartschoolSync->syncAll(false);
                    }
                    $timedOut = (bool)($stats['_meta']['timed_out'] ?? false);
                    $syncResult = [
                        'executed' => true,
                        'success' => true,
                        'stats' => $stats,
                        'message' => $timedOut
                            ? 'Synchronisation Smartschool partielle (limite de 10s atteinte)'
                            : 'Synchronisation Smartschool SOAP V3 terminee'
                    ];
                } catch (Exception $syncError) {
                    error_log('Smartschool sync error at login: ' . $syncError->getMessage());
                    $syncResult = [
                        'executed' => true,
                        'success' => false,
                        'stats' => null,
                        'message' => $syncError->getMessage()
                    ];
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Authentification réussie',
                    'user' => $user,
                    'smartschool_sync' => $syncResult
                ]);
            } else {
                RateLimiterService::registerFailure($ip, $username);
                echo json_encode([
                    'success' => false,
                    'message' => 'Identifiants invalides',
                    'source' => 'authController'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * API : Déconnexion
     */
    public function logout($params = []) {
        header('Content-Type: application/json');
        
        try {
            if (!isset($_SESSION)) {
                session_start();
            }
            
            session_destroy();
            
            echo json_encode([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}

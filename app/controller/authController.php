<?php
namespace App\Controller;

use App\Model\UsersModel;
use App\Service\OneRosterSync;
use Exception;

class AuthController {
    private UsersModel $usersModel;
    private OneRosterSync $oneRosterSync;

    public function __construct() {
        $this->usersModel = new UsersModel();
        $this->oneRosterSync = new OneRosterSync();
    }

    /**
     * Affiche la page de connexion
     */
    public function index() {
        require_once __DIR__ . '/../view/layout.php';
    }

    /**
     * API : Vérifier l'authentification
     */
    public function verify($params = []) {
        header('Content-Type: application/json');
        error_log('AuthController verify called');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input) && isset($params['username']) && isset($params['password'])) {
                $input = ['username' => $params['username'], 'password' => $params['password']];
            }

            error_log('Login input: ' . json_encode($input));

            if (!$input || !isset($input['username']) || !isset($input['password'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Identifiants manquants'
                ]);
                exit;
            }

            $user = $this->usersModel->authenticate($input['username'], $input['password']);
            
            if ($user) {
                // Démarrer une session
                if (!isset($_SESSION)) {
                    session_start();
                }
                
                $_SESSION['user_id'] = $user['id_user'];
                $_SESSION['username'] = $user['nom'];
                $_SESSION['role'] = $user['role'];

                $syncResult = [
                    'executed' => false,
                    'success' => false,
                    'stats' => null,
                    'message' => ''
                ];

                try {
                    $stats = $this->oneRosterSync->syncStudents(false);
                    $syncResult = [
                        'executed' => true,
                        'success' => true,
                        'stats' => $stats,
                        'message' => 'Synchronisation OneRoster terminee'
                    ];
                } catch (Exception $syncError) {
                    error_log('OneRoster sync error at login: ' . $syncError->getMessage());
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
                    'oneroster_sync' => $syncResult
                ]);
            } else {
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

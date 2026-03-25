<?php
namespace App\Controller;

use App\Model\UsersModel;
use Exception;

class AuthController {
    private UsersModel $usersModel;

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
     * API : Vérifier l'authentification
     */
    public function verify($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
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
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Authentification réussie',
                    'user' => $user
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Identifiants invalides'
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

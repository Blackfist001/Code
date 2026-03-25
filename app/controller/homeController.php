<?php
namespace App\Controller;

use Exception;

class HomeController {
    
    /**
     * Affiche la page d'accueil
     */
    public function index() {
        // Vérifier si l'utilisateur est connecté
        if (!isset($_SESSION['user_id'])) {
            // Rediriger vers la page de connexion
            header('Location: /login');
            exit;
        }
        
        // Afficher la page d'accueil/dashboard
        header('Location: /dashboard');
        exit;
    }
}

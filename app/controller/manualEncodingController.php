<?php
namespace App\Controller;

class ManualEncodingController {
    /**
     * Affiche la page d'encodage manuel des passages
     */
    public function index() {
        require_once '../app/view/manualEncodingView.php';
    }
}



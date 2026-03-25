<?php
namespace App\Controller;

use App\Model\MovementsModel;

class ScanController {
    
    // Pour l'affichage initial (si vous utilisez encore une vue PHP)
    public function index() {
        require_once '../app/view/scanView.php';
    }

    // LE POINT D'ENTRÉE API pour ajouter un scan
    public function ajouter($params = []) {
        // 1. On s'assure que la réponse est du JSON
        header('Content-Type: application/json');

        // 2. On récupère les données envoyées par JS (FormData ou $_POST)
        $studentId = $_POST['student_id'] ?? $_POST['id_etudiant'] ?? null;
        $typePassage = $_POST['type_passage'] ?? $_POST['movement_type'] ?? 'entree_matin';
        
        if (!$studentId) {
            echo json_encode(['success' => false, 'message' => 'ID élève manquant']);
            return;
        }

        // 3. Appel au Modèle pour enregistrer en BDD
        $model = new MovementsModel();
        $movementData = [
            'id_etudiant' => $studentId,
            'type_passage' => $typePassage,
            'statut' => 'autorise'
        ];
        $result = $model->addMovement($movementData);

        // 4. On répond au JS
        echo json_encode([
            'success' => $result,
            'message' => $result ? 'Scan enregistré' : 'Erreur lors de l\'enregistrement'
        ]);
    }
}

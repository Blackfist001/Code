<?php
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="passages_' . date('Y-m-d') . '.csv"');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\MovementsModel;

try {
    $dateFrom = isset($_GET['date_from']) ? $_GET['date_from'] : null;
    $dateTo = isset($_GET['date_to']) ? $_GET['date_to'] : null;
    
    $movementsModel = new MovementsModel();
    
    if ($dateFrom && $dateTo) {
        $passages = $movementsModel->getMovementsBetweenDates($dateFrom, $dateTo);
    } else {
        $passages = $movementsModel->getAllMovements();
    }
    
    // En-têtes CSV
    echo "Date,Heure,ID Étudiant,Nom,Prénom,Classe,Type,Statut\n";
    
    // Données
    foreach ($passages as $passage) {
        $row = [
            $passage['date_passage'] ?? '',
            $passage['heure_passage'] ?? '',
            $passage['id_etudiant'] ?? '',
            $passage['nom'] ?? '',
            $passage['prenom'] ?? '',
            $passage['classe'] ?? '',
            $passage['type_passage'] ?? '',
            $passage['statut'] ?? ''
        ];
        echo implode(',', $row) . "\n";
    }
    
} catch (Exception $e) {
    echo "Erreur:" . $e->getMessage();
}

<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';

use App\Model\StudentsModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['nom']) || !isset($input['prenom'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Données invalides - nom et prenom requis'
        ]);
        exit;
    }

    $studentsModel = new StudentsModel();
    
    // Préparer les données de l'étudiant
    $studentData = [
        'nom' => $input['nom'],
        'prenom' => $input['prenom'],
        'classe' => $input['classe'] ?? '',
        'email' => $input['email'] ?? '',
        'photo' => $input['photo'] ?? 'photos/default.jpg',
        'autorisation_midi' => $input['autorisation_midi'] ?? 0
    ];
    
    // Ajouter l'étudiant
    $success = $studentsModel->addStudent($studentData);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Étudiant créé avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la création de l\'étudiant'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}

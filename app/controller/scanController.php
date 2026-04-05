<?php
namespace App\Controller;

use App\Core\ScanRules;
use App\Model\MovementsModel;
use App\Model\StudentsModel;
use App\Model\SchedulesModel;

class ScanController {

    // Pour l'affichage initial (si vous utilisez encore une vue PHP)
    public function index() {
        require_once '../app/view/scanView.php';
    }

    // LE POINT D'ENTRÉE API pour enregistrer un scan
    public function ajouter($params = []) {
        header('Content-Type: application/json');
        // Capturer tout output parasite (notices, warnings) pour ne jamais corrompre le JSON
        ob_start();

        try {
            $input     = json_decode(file_get_contents('php://input'), true) ?? [];
            $sourcedId = trim($input['sourcedId'] ?? $_POST['sourcedId'] ?? '');

            if ($sourcedId === '') {
                $sourcedId = null;
            }

            if (!$sourcedId) {
                ob_end_clean();
                echo json_encode(['success' => false, 'message' => 'sourcedId manquant']);
                return;
            }

            $student = (new StudentsModel())->getStudentBySourcedId($sourcedId);

            if (!$student) {
                ob_end_clean();
                echo json_encode(['success' => false, 'message' => 'Étudiant non trouvé (sourcedId : ' . htmlspecialchars($sourcedId) . ')']);
                return;
            }

            $studentId = $student['id_etudiant'];

            $now             = new \DateTime();
            $jourFr          = $this->getDayFr($now);
            $coursAujourdhui = (new SchedulesModel())->getScheduleByClassAndDay($student['classe'] ?? '', $jourFr);

            $movementsModel = new MovementsModel();
            $passagesTypes  = $movementsModel->getTodayPassageTypes($studentId);

            // Déléguer toute la logique métier à ScanRules
            $rules  = new ScanRules();
            $result = $rules->calculer($student, $coursAujourdhui, $passagesTypes, $now);

            $typePassage = $result['type_passage'];
            $statut      = $result['statut'];

            $success = $movementsModel->addMovement([
                'id_etudiant'  => $studentId,
                'type_passage' => $typePassage,
                'statut'       => $statut,
                'scan'         => true,
                'manual'       => false,
            ]);

            $typeLabels   = ScanRules::typeLabels();
            $statutLabels = ScanRules::statutLabels();

            ob_end_clean();
            echo json_encode([
                'success'      => $success,
                'message'      => $success ? 'Scan enregistré' : 'Erreur lors de l\'enregistrement',
                'type_passage' => $typePassage,
                'type_label'   => $typeLabels[$typePassage] ?? $typePassage,
                'statut'       => $statut,
                'statut_label' => $statutLabels[$statut] ?? $statut,
                'student'      => [
                    'id'                => $student['id_etudiant'],
                    'nom'               => $student['nom'],
                    'prenom'            => $student['prenom'],
                    'classe'            => $student['classe'],
                    'autorisation_midi' => (bool)$student['autorisation_midi'],
                ],
            ]);

        } catch (\Throwable $e) {
            ob_end_clean();
            error_log('[ScanController] ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erreur serveur : ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Retourne le nom du jour en français à partir d'un objet DateTime.
     */
    private function getDayFr(\DateTime $date): string {
        $map = [
            'Monday'    => 'lundi',
            'Tuesday'   => 'mardi',
            'Wednesday' => 'mercredi',
            'Thursday'  => 'jeudi',
            'Friday'    => 'vendredi',
            'Saturday'  => 'samedi',
            'Sunday'    => 'dimanche',
        ];
        return $map[$date->format('l')] ?? strtolower($date->format('l'));
    }
}

<?php
namespace App\Controller;

use App\Model\SchedulesModel;
use Exception;

class SchedulesController {
    private SchedulesModel $schedulesModel;

    public function __construct() {
        $this->schedulesModel = new SchedulesModel();
    }

    /**
     * API : Récupérer l'horaire d'une classe pour un jour donné
     *
     * @param array $params Paramètres de route, doit contenir 'classe'
     * @return void Réponse JSON {success, classe, jour, schedule}
     */
    public function getByClass($params) {
        header('Content-Type: application/json');
        try {
            $classe = $params['classe'] ?? null;
            if (!$classe) {
                echo json_encode(['success' => false, 'message' => 'Classe requise']);
                return;
            }

            $jour = $_GET['jour'] ?? strftime('%A', time());
            if (empty($jour)) { $jour = date('l'); }

            $schedule = $this->schedulesModel->getScheduleByClassAndDay($classe, $jour);

            echo json_encode([
                'success' => true,
                'classe' => $classe,
                'jour' => $jour,
                'schedule' => $schedule
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Récupérer tous les créneaux horaires disponibles
     *
     * @return void Réponse JSON {success, count, results[]}
     */
    public function getCreneaux() {
        header('Content-Type: application/json');
        try {
            $creneaux = $this->schedulesModel->getAllCreneaux();
            $debut = is_array($creneaux['debut'] ?? null) ? $creneaux['debut'] : [];
            $fin = is_array($creneaux['fin'] ?? null) ? $creneaux['fin'] : [];
            echo json_encode([
                'success' => true,
                'count' => count($debut) + count($fin),
                'results' => $creneaux
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Ajouter un créneau dans la table début ou fin.
     */
    public function addSlot() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $type = strtolower(trim((string)($input['type'] ?? '')));
            $creneau = trim((string)($input['creneau'] ?? ''));

            if (!in_array($type, ['debut', 'fin'], true) || $creneau === '') {
                echo json_encode(['success' => false, 'message' => 'Type et créneau requis']);
                return;
            }

            $success = $this->schedulesModel->addSlot($type, $creneau);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Créneau ajouté']
                : ['success' => false, 'message' => 'Erreur lors de l\'ajout']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Mettre à jour un créneau dans la table début ou fin.
     */
    public function updateSlot() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            $type = strtolower(trim((string)($input['type'] ?? '')));
            $creneau = trim((string)($input['creneau'] ?? ''));

            if ($id <= 0 || !in_array($type, ['debut', 'fin'], true) || $creneau === '') {
                echo json_encode(['success' => false, 'message' => 'ID, type et créneau requis']);
                return;
            }

            $success = $this->schedulesModel->updateSlot($type, $id, $creneau);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Créneau modifié']
                : ['success' => false, 'message' => 'Erreur lors de la modification']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Supprimer un créneau dans la table début ou fin.
     */
    public function deleteSlot() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            $type = strtolower(trim((string)($input['type'] ?? '')));

            if ($id <= 0 || !in_array($type, ['debut', 'fin'], true)) {
                echo json_encode(['success' => false, 'message' => 'ID et type requis']);
                return;
            }

            $success = $this->schedulesModel->deleteSlot($type, $id);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Créneau supprimé']
                : ['success' => false, 'message' => 'Erreur lors de la suppression']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Récupérer tous les horaires de cours
     *
     * @return void Réponse JSON {success, count, results[]}
     */
    public function getAll() {
        header('Content-Type: application/json');
        try {
            $schedules = $this->schedulesModel->getAllSchedules();
            echo json_encode(['success' => true, 'count' => count($schedules), 'results' => $schedules]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Ajouter un horaire de cours
     *
     * @return void Réponse JSON {success, message}
     * @throws \RuntimeException('CLASSE_INTROUVABLE') si la classe n'existe pas
     * @throws \RuntimeException('MATIERE_INTROUVABLE') si la matière n'existe pas
     * @throws \RuntimeException('CRENEAU_INTROUVABLE') si le créneau est introuvable
     */
    public function add() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $hasClasse = !empty($input['id_classe']) || !empty($input['classe']);
            $hasMatiere = !empty($input['id_matiere']) || !empty($input['matiere']);
            $hasCreneauDebut = !empty($input['id_creneau_debut']) || !empty($input['heure_debut']);
            $hasCreneauFin = !empty($input['id_creneau_fin']) || !empty($input['heure_fin']);
            if (!$input || !$hasClasse || !$hasMatiere || empty($input['jour_semaine']) || !$hasCreneauDebut || !$hasCreneauFin) {
                echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
                return;
            }
            $success = $this->schedulesModel->addSchedule($input);
            echo json_encode($success
                ? ['success' => true,  'message' => 'Horaire ajouté']
                : ['success' => false, 'message' => 'Erreur lors de l\'ajout']);
        } catch (\RuntimeException $e) {
            $messages = [
                'CLASSE_INTROUVABLE'  => "Classe introuvable — vérifiez que la classe sélectionnée existe.",
                'MATIERE_INTROUVABLE' => "Matière introuvable — vérifiez que la matière sélectionnée existe.",
                'CRENEAU_INTROUVABLE' => "Créneau horaire introuvable — vérifiez les créneaux sélectionnés.",
                'LOCAL_INTROUVABLE'   => "Local introuvable — vérifiez le local sélectionné.",
            ];
            $msg = $messages[$e->getMessage()] ?? $e->getMessage();
            echo json_encode(['success' => false, 'message' => $msg]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Enregistrer l'ensemble de la grille horaire d'une classe.
     *
     * @return void Réponse JSON {success, message, inserted, deleted}
     */
    public function saveClassGrid() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $hasClasse = !empty($input['id_classe']) || !empty($input['classe']);
            if (!$hasClasse) {
                echo json_encode(['success' => false, 'message' => 'Classe requise']);
                return;
            }

            if (!isset($input['entries']) || !is_array($input['entries'])) {
                echo json_encode(['success' => false, 'message' => 'Grille invalide']);
                return;
            }

            $result = $this->schedulesModel->saveClassScheduleGrid($input);
            echo json_encode([
                'success' => true,
                'message' => 'Horaire de classe enregistré',
                'inserted' => $result['inserted'] ?? 0,
                'deleted' => $result['deleted'] ?? 0,
            ]);
        } catch (\RuntimeException $e) {
            $messages = [
                'CLASSE_INTROUVABLE'      => 'Classe introuvable.',
                'MATIERE_INTROUVABLE'     => 'Une matière sélectionnée est introuvable.',
                'CRENEAU_INTROUVABLE'     => 'Un créneau de début est introuvable.',
                'CRENEAU_FIN_INTROUVABLE' => 'Aucun créneau de fin trouvé à +50 minutes pour un des créneaux de début.',
                'JOUR_INVALIDE'           => 'Un jour de la grille est invalide.',
            ];
            $msg = $messages[$e->getMessage()] ?? $e->getMessage();
            echo json_encode(['success' => false, 'message' => $msg]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Mettre à jour un horaire de cours
     *
     * @return void Réponse JSON {success, message}
     * @throws \RuntimeException('CLASSE_INTROUVABLE') si la classe n'existe pas
     * @throws \RuntimeException('MATIERE_INTROUVABLE') si la matière n'existe pas
     * @throws \RuntimeException('CRENEAU_INTROUVABLE') si le créneau est introuvable
     */
    public function update() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }
            $id = (int)$input['id'];
            unset($input['id']);
            $success = $this->schedulesModel->updateSchedule($id, $input);
            echo json_encode($success
                ? ['success' => true,  'message' => 'Horaire modifié']
                : ['success' => false, 'message' => 'Erreur lors de la modification']);
        } catch (\RuntimeException $e) {
            $messages = [
                'CLASSE_INTROUVABLE'  => "Classe introuvable — vérifiez que la classe sélectionnée existe.",
                'MATIERE_INTROUVABLE' => "Matière introuvable — vérifiez que la matière sélectionnée existe.",
                'CRENEAU_INTROUVABLE' => "Créneau horaire introuvable — vérifiez les créneaux sélectionnés.",
                'LOCAL_INTROUVABLE'   => "Local introuvable — vérifiez le local sélectionné.",
            ];
            $msg = $messages[$e->getMessage()] ?? $e->getMessage();
            echo json_encode(['success' => false, 'message' => $msg]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Supprimer un horaire de cours
     *
     * @return void Réponse JSON {success, message}
     */
    public function delete() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }
            $success = $this->schedulesModel->deleteSchedule((int)$input['id']);
            echo json_encode($success
                ? ['success' => true,  'message' => 'Horaire supprimé']
                : ['success' => false, 'message' => 'Horaire introuvable']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}

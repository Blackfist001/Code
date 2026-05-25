<?php
namespace App\Controller;

use App\Model\MovementsModel;
use App\Model\ClassesModel;
use App\Service\ValidationService;
use App\Service\AuditService;
use Exception;

class AbsenceController {
    private MovementsModel $movementsModel;
    private ClassesModel $classesModel;

    public function __construct() {
        $this->movementsModel = new MovementsModel();
        $this->classesModel = new ClassesModel();
    }

    /**
     * Construit un tableau id_classe => nom_classe pour le contrôleur courant.
     *
     * @return array<int, string>
     */
    private function getClassMapById(): array {
        $map = [];
        foreach ($this->classesModel->getAllClasses() as $class) {
            $map[(int)$class['id_classe']] = $class['classe'];
        }
        return $map;
    }

    /**
     * Remplace le champ 'classe' (id numérique) par le nom lisible dans chaque ligne.
     *
     * @param array $rows Lignes issues de la base de données
     * @return array Lignes avec 'classe' résolu en nom
     */
    private function enrichClasseNom(array $rows): array {
        if (empty($rows)) {
            return $rows;
        }

        $classMap = $this->getClassMapById();
        foreach ($rows as &$row) {
            $rawClasse = $row['classe'] ?? null;
            $classId = is_numeric($rawClasse) ? (int)$rawClasse : 0;
            if ($classId > 0) {
                $row['classe_id'] = $classId;
            }
            $row['classe'] = $classMap[$classId] ?? (string)($rawClasse ?? '');
        }
        unset($row);

        return $rows;
    }

    /**
     * Affiche la page des absences
     */
    public function index() {
        require_once __DIR__ . '/../view/absenceView.php';
    }

    /**
     * Vérifie que l'utilisateur a les rôles requis
     *
     * @param array $allowedRoles Rôles autorisés
     * @throws Exception Si non authentifié ou rôle insuffisant
     */
    private function requireRole(...$allowedRoles) {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            throw new Exception('Non authentifié');
        }
        
        $userRole = $_SESSION['role'] ?? null;
        if (!in_array($userRole, $allowedRoles)) {
            http_response_code(403);
            throw new Exception("Accès refusé: rôle insuffisant");
        }
    }

    private function lookupPassageId(\PDO $pdo, string $table, string $idColumn, string $label): int {
        $stmt = $pdo->prepare("SELECT {$idColumn} FROM {$table} WHERE label = :label LIMIT 1");
        $stmt->execute([':label' => $label]);
        $id = $stmt->fetchColumn();
        if (!is_numeric($id)) {
            throw new Exception(sprintf('Valeur de référence introuvable: %s', $label));
        }
        return (int)$id;
    }

    /**
     * Journalise les actions liées aux absences sans bloquer le flux métier en cas d'échec d'audit.
     *
     * @param mixed $oldData
     * @param mixed $newData
     * @param array<string,mixed> $meta
     */
    private function logAbsenceAudit(string $action, string $entity, $oldData, $newData, array $meta = []): void {
        try {
            AuditService::logDbChange($action, $entity, $oldData, $newData, $meta);
        } catch (\Throwable $auditError) {
            error_log('[AbsenceController] audit failed: ' . $auditError->getMessage());
        }
    }

    /**
     * API : Obtenir les absents d'aujourd'hui
     */
    public function getTodayAbsents($params = []) {
        header('Content-Type: application/json');
        
        try {
            // Vérifier l'authentification et les rôles
            $this->requireRole('Gestionnaire', 'Surveillant');
            
            $pdo = (new \App\Core\DataBase())->getPdo();

            // Règle métier: absent si une des entrées journalières est manquante
            // (Entrée matin et/ou Entrée après-midi).
            $stmt = $pdo->prepare("
                SELECT e.id_etudiant,
                       :today_display AS date_passage,
                       CASE
                           WHEN morning_entry.id_etudiant IS NULL AND afternoon_entry.id_etudiant IS NULL THEN 'Entrée matin + Entrée après-midi'
                           WHEN morning_entry.id_etudiant IS NULL THEN 'Entrée matin'
                           ELSE 'Entrée après-midi'
                       END AS type_passage,
                       'Absent' AS statut,
                       NULL AS raison,
                       e.nom,
                       e.prenom,
                       e.classe,
                       COALESCE(e.demi_journee_absence, 0) AS demi_journee_absence,
                       CASE
                           WHEN morning_entry.id_etudiant IS NULL AND afternoon_entry.id_etudiant IS NULL THEN 'missing-both-entries'
                           WHEN morning_entry.id_etudiant IS NULL THEN 'missing-morning-entry'
                           ELSE 'missing-afternoon-entry'
                       END AS absence_source
                FROM etudiants e
                LEFT JOIN (
                    SELECT DISTINCT p.id_etudiant
                    FROM passages p
                                        JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
                    WHERE p.date_passage = :today_morning
                                            AND tp.label = 'Entrée matin'
                ) morning_entry ON morning_entry.id_etudiant = e.id_etudiant
                LEFT JOIN (
                    SELECT DISTINCT p.id_etudiant
                    FROM passages p
                                        JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
                    WHERE p.date_passage = :today_afternoon
                                            AND tp.label = 'Entrée après-midi'
                ) afternoon_entry ON afternoon_entry.id_etudiant = e.id_etudiant
                WHERE morning_entry.id_etudiant IS NULL
                   OR afternoon_entry.id_etudiant IS NULL
                ORDER BY e.nom, e.prenom
            ");
            $today = date('Y-m-d');
            $stmt->execute([
                ':today_display' => $today,
                ':today_morning' => $today,
                ':today_afternoon' => $today,
            ]);
            $absents = $this->enrichClasseNom($stmt->fetchAll(\PDO::FETCH_ASSOC));

            echo json_encode([
                'success' => true,
                'count' => count($absents),
                'results' => $absents
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Marquer une absence
     */
    public function markAbsent($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id_etudiant'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID étudiant requis'
                ]);
                exit;
            }

            $reason = $input['reason'] ?? '';
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $stmt = $pdo->prepare("
                INSERT INTO passages (id_etudiant, date_passage, heure_passage, id_type_passage, id_statut_passage, demi_journee_absence)
                VALUES (:id_etudiant, :date_passage, :heure_passage, :id_type_passage, :id_statut_passage, :demi_journee_absence)
            ");
            
            $stmt->execute([
                ':id_etudiant'          => $input['id_etudiant'],
                ':date_passage'         => date('Y-m-d'),
                ':heure_passage'        => date('H:i:s'),
                ':id_type_passage'      => $this->lookupPassageId($pdo, 'types_passage', 'id_type_passage', 'Journée'),
                ':id_statut_passage'    => $this->lookupPassageId($pdo, 'statuts_passage', 'id_statut_passage', 'Absent'),
                ':demi_journee_absence' => 2,
            ]);

            $this->logAbsenceAudit(
                'insert',
                'passages',
                null,
                [
                    'id_etudiant' => (int)$input['id_etudiant'],
                    'date_passage' => date('Y-m-d'),
                    'heure_passage' => date('H:i:s'),
                    'type_passage' => 'Journée',
                    'statut' => 'Absent',
                    'demi_journee_absence' => 2,
                ],
                [
                    'source' => 'absence_controller',
                    'reason' => (string)$reason,
                ]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Absence enregistrée'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Marquer une absence justifiée
     */
    public function markJustifiedAbsent($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id_etudiant'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID étudiant requis'
                ]);
                exit;
            }

            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $stmt = $pdo->prepare("
                INSERT INTO passages (id_etudiant, date_passage, heure_passage, id_type_passage, id_statut_passage, demi_journee_absence)
                VALUES (:id_etudiant, :date_passage, :heure_passage, :id_type_passage, :id_statut_passage, :demi_journee_absence)
            ");
            
            $stmt->execute([
                ':id_etudiant'          => $input['id_etudiant'],
                ':date_passage'         => date('Y-m-d'),
                ':heure_passage'        => date('H:i:s'),
                ':id_type_passage'      => $this->lookupPassageId($pdo, 'types_passage', 'id_type_passage', 'Journée'),
                ':id_statut_passage'    => $this->lookupPassageId($pdo, 'statuts_passage', 'id_statut_passage', 'Absence justifiée'),
                ':demi_journee_absence' => 2,
            ]);

            $this->logAbsenceAudit(
                'insert',
                'passages',
                null,
                [
                    'id_etudiant' => (int)$input['id_etudiant'],
                    'date_passage' => date('Y-m-d'),
                    'heure_passage' => date('H:i:s'),
                    'type_passage' => 'Journée',
                    'statut' => 'Absence justifiée',
                    'demi_journee_absence' => 2,
                ],
                [
                    'source' => 'absence_controller',
                ]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Absence justifiée enregistrée'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Persister en lot les absences calculées côté client.
     *
     * Corps JSON attendu :
     * {
     *   "date_passage": "YYYY-MM-DD",
     *   "student_ids": [1,2,3],
     *   "classe": "6A" (optionnel)
     * }
     */
    public function persistBatchAbsences($params = []) {
        header('Content-Type: application/json');

        try {
            $this->requireRole('Gestionnaire', 'Surveillant');

            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $datePassage = (string)($input['date_passage'] ?? date('Y-m-d'));
            $studentIds = $input['student_ids'] ?? [];

            if (!is_array($studentIds) || empty($studentIds)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Aucun étudiant absent à persister.'
                ]);
                return;
            }

            $studentIds = array_values(array_unique(array_filter(array_map('intval', $studentIds), static fn($id) => $id > 0)));
            if (empty($studentIds)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Liste des étudiants invalide.'
                ]);
                return;
            }

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $datePassage)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Format date_passage invalide (YYYY-MM-DD attendu).'
                ]);
                return;
            }

            $pdo = (new \App\Core\DataBase())->getPdo();

            $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
            $sql = "
                INSERT INTO passages (
                    id_etudiant,
                    date_passage,
                    heure_passage,
                                        id_type_passage,
                                        id_statut_passage,
                    scan,
                    manualEncoding,
                    demi_journee_absence
                )
                SELECT e.id_etudiant,
                       ?,
                       '00:00:00',
                                             (SELECT id_type_passage FROM types_passage WHERE label = 'Journée' LIMIT 1),
                                             (SELECT id_statut_passage FROM statuts_passage WHERE label = 'Absent' LIMIT 1),
                       0,
                       0,
                       1
                FROM etudiants e
                WHERE e.id_etudiant IN ($placeholders)
                  AND NOT EXISTS (
                        SELECT 1
                                                FROM passages p
                                                LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
                                                LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
                        WHERE p.id_etudiant = e.id_etudiant
                          AND p.date_passage = ?
                                                    AND tp.label = 'Journée'
                                                    AND sp.label IN ('Absent', 'Absence justifiée')
                  )
                  AND NOT EXISTS (
                        SELECT 1
                                                FROM passages p2
                                                LEFT JOIN types_passage tp2 ON tp2.id_type_passage = p2.id_type_passage
                                                LEFT JOIN statuts_passage sp2 ON sp2.id_statut_passage = p2.id_statut_passage
                        WHERE p2.id_etudiant = e.id_etudiant
                          AND p2.date_passage = ?
                                                    AND tp2.label IN ('Entrée matin', 'Entrée après-midi')
                                                    AND sp2.label IN ('Présent', 'En retard')
                  )
            ";

            $stmt = $pdo->prepare($sql);
            $bind = array_merge([$datePassage], $studentIds, [$datePassage, $datePassage]);
            $stmt->execute($bind);
            $inserted = (int)$stmt->rowCount();

            $this->logAbsenceAudit(
                'insert_batch',
                'passages',
                null,
                [
                    'date_passage' => $datePassage,
                    'classe' => (string)($input['classe'] ?? ''),
                    'student_ids' => $studentIds,
                    'requested' => count($studentIds),
                    'inserted' => $inserted,
                    'type_passage' => 'Journée',
                    'statut' => 'Absent',
                ],
                [
                    'source' => 'absents/persist-batch',
                ]
            );

            echo json_encode([
                'success' => true,
                'message' => 'Absences persistées.',
                'requested' => count($studentIds),
                'inserted' => $inserted,
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * API : Obtenir l'historique des absents
     */
    public function getAbsentHistory($params = []) {
        header('Content-Type: application/json');
        
        try {
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01', strtotime('-1 month'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            $studentId = $_GET['student_id'] ?? null;
            
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $query = "SELECT e.*, p.date_passage, sp.label AS statut 
                      FROM etudiants e
                      JOIN passages p ON e.id_etudiant = p.id_etudiant
                      LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
                      WHERE p.date_passage BETWEEN :date_from AND :date_to
                      AND sp.label IN ('Absent', 'Absence justifiée')";
            
            $bindParams = [
                ':date_from' => $dateFrom,
                ':date_to' => $dateTo
            ];
            
            if ($studentId) {
                $query .= " AND e.id_etudiant = :student_id";
                $bindParams[':student_id'] = $studentId;
            }
            
            $query .= " ORDER BY p.date_passage DESC";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($bindParams);
            $results = $this->enrichClasseNom($stmt->fetchAll(\PDO::FETCH_ASSOC));
            
            echo json_encode([
                'success' => true,
                'count' => count($results),
                'results' => $results
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}

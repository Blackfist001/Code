<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class SchedulesModel {
    private DataBase $db;
    private ClassesModel $classesModel;
    private CourseModel $courseModel;
    private TimeSlotModel $timeSlotModel;

    public function __construct() {
        $this->db = new DataBase();
        $this->classesModel = new ClassesModel();
        $this->courseModel = new CourseModel();
        $this->timeSlotModel = new TimeSlotModel();
    }

    /**
     * Résout une valeur (id ou nom) en identifiant de classe.
     *
     * @param mixed $classeValue ID numérique ou nom de la classe
     * @return int|null null si introuvable
     */
    private function resolveClassId($classeValue): ?int {
        if ($classeValue === null || $classeValue === '') {
            return null;
        }

        if (is_numeric($classeValue)) {
            $class = $this->classesModel->getClassById((int)$classeValue);
            return $class ? (int)$class['id_classe'] : null;
        }

        $class = $this->classesModel->getClassByName((string)$classeValue);
        return $class ? (int)$class['id_classe'] : null;
    }

    /**
     * Résout une valeur (id ou nom) en identifiant de matière.
     *
     * @param mixed $matiereValue ID numérique ou nom de la matière
     * @return int|null null si introuvable
     */
    private function resolveMatiereId($matiereValue): ?int {
        if ($matiereValue === null || $matiereValue === '') {
            return null;
        }

        if (is_numeric($matiereValue)) {
            $matiere = $this->courseModel->getMatiereById((int)$matiereValue);
            return $matiere ? (int)$matiere['id_matiere'] : null;
        }

        $matiere = $this->courseModel->getMatiereByName((string)$matiereValue);
        return $matiere ? (int)$matiere['id_matiere'] : null;
    }

    /**
     * Résout une valeur (id ou heure) en identifiant de créneau horaire.
     *
     * @param mixed $creneauValue ID numérique ou heure (HH:MM)
     * @return int|null null si introuvable
     */
    private function resolveCreneauId($creneauValue): ?int {
        return $this->timeSlotModel->resolveId($creneauValue);
    }

    /**
     * Enrichit les horaires avec le nom de classe et le nom de matière lisibles.
     *
     * @param array $schedules Lignes horaires_cours issues de la BDD
     * @return array Lignes enrichies
     */
    private function addClassNamesToSchedules(array $schedules): array {
        foreach ($schedules as &$schedule) {
            $classId = isset($schedule['id_classe']) ? (int)$schedule['id_classe'] : 0;
            $class = $this->classesModel->getClassById($classId);
            $schedule['classe'] = $class['classe'] ?? ($schedule['classe'] ?? null);

            if (!isset($schedule['matiere']) && isset($schedule['id_matiere'])) {
                $matiere = $this->courseModel->getMatiereById((int)$schedule['id_matiere']);
                $schedule['matiere'] = $matiere['matiere'] ?? null;
            }
        }
        unset($schedule);

        return $schedules;
    }

    public function getScheduleByClassAndDay(string $classe, string $jour): array {
        $classId = $this->resolveClassId($classe);
        if ($classId === null) {
            return [];
        }

        // Normaliser le jour pour comparer avec différents formats
        $jourSql = strtolower($jour);

        $schedule = $this->timeSlotModel->getScheduleByClassAndDay($classId, $jourSql);

        if (empty($schedule)) {
            // Si pas de résultat avec jour exact, essaye versions anglaises/françaises
            $jourConverti = $this->convertDayToFrench($jourSql);
            if ($jourConverti && $jourConverti !== $jourSql) {
                $schedule = $this->timeSlotModel->getScheduleByClassAndDay($classId, $jourConverti);
            }
        }

        return $schedule;
    }

    /**
     * Retourne tous les créneaux horaires disponibles.
     *
     * @return array
     */
    public function getAllCreneaux(): array {
        return $this->timeSlotModel->getAll();
    }

    /**
     * Normalise un nom de jour (anglais ou français) en nom français minuscule.
     *
     * @param string $jour Jour en toutes casses (ex : 'Monday', 'lundi')
     * @return string Nom du jour en français minuscule
     */
    private function convertDayToFrench(string $jour): string {
        $mapping = [
            'monday' => 'lundi', 'tuesday' => 'mardi', 'wednesday' => 'mercredi',
            'thursday' => 'jeudi', 'friday' => 'vendredi', 'saturday' => 'samedi',
            'sunday' => 'dimanche', 'lundi' => 'lundi', 'mardi' => 'mardi',
            'mercredi' => 'mercredi', 'jeudi' => 'jeudi', 'vendredi' => 'vendredi',
            'samedi' => 'samedi', 'dimanche' => 'dimanche'
        ];
        return $mapping[$jour] ?? $jour;
    }

    /**
     * Retourne tous les horaires de cours enrichis des noms de classe et de matière.
     *
     * @return array
     */
    public function getAllSchedules(): array {
        try {
            $results = $this->timeSlotModel->getAllSchedulesWithTimeSlots();
            if (empty($results)) {
                return [];
            }
            return $this->addClassNamesToSchedules($results);
        } catch (Exception $e) {
            error_log('getAllSchedules: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Insère un nouvel horaire de cours.
     *
     * @param array $data Champs attendus : id_classe (ou classe), id_matiere (ou matiere),
     *                    jour_semaine, id_creneau_debut (ou heure_debut),
     *                    id_creneau_fin (ou heure_fin), salle (optionnel)
     * @return bool true si la ligne a été insérée
     * @throws \RuntimeException('CLASSE_INTROUVABLE')  si la classe n'existe pas
     * @throws \RuntimeException('MATIERE_INTROUVABLE') si la matière n'existe pas
     * @throws \RuntimeException('CRENEAU_INTROUVABLE') si l'un des créneaux est introuvable
     */
    public function addSchedule(array $data): bool {
        $pdo = $this->db->getPdo();
        $classId = $this->resolveClassId($data['id_classe'] ?? ($data['classe'] ?? null));
        $matiereId = $this->resolveMatiereId($data['id_matiere'] ?? ($data['matiere'] ?? null));
        $creneauDebutId = $this->resolveCreneauId($data['id_creneau_debut'] ?? ($data['heure_debut'] ?? null));
        $creneauFinId = $this->resolveCreneauId($data['id_creneau_fin'] ?? ($data['heure_fin'] ?? null));
        if ($classId === null) {
            throw new \RuntimeException('CLASSE_INTROUVABLE');
        }
        if ($matiereId === null) {
            throw new \RuntimeException('MATIERE_INTROUVABLE');
        }
        if ($creneauDebutId === null || $creneauFinId === null) {
            throw new \RuntimeException('CRENEAU_INTROUVABLE');
        }
        $stmt = $pdo->prepare(
            "INSERT INTO horaires_cours (id_classe, id_matiere, jour_semaine, id_creneau_debut, id_creneau_fin, salle)
             VALUES (:id_classe, :id_matiere, :jour_semaine, :id_creneau_debut, :id_creneau_fin, :salle)"
        );
        try {
            $stmt->execute([
                ':id_classe'    => $classId,
                ':id_matiere'   => $matiereId,
                ':jour_semaine' => $data['jour_semaine'] ?? '',
                ':id_creneau_debut' => $creneauDebutId,
                ':id_creneau_fin'   => $creneauFinId,
                ':salle'        => $data['salle']        ?? null,
            ]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('addSchedule: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Met à jour un horaire de cours existant. Seuls les champs fournis sont modifiés.
     *
     * @param int   $id
     * @param array $data Champs modifiables : id_classe/classe, id_matiere/matiere,
     *                    jour_semaine, id_creneau_debut/heure_debut,
     *                    id_creneau_fin/heure_fin, salle
     * @return bool true si la ligne a été modifiée
     * @throws \RuntimeException('CLASSE_INTROUVABLE')  si la classe n'existe pas
     * @throws \RuntimeException('MATIERE_INTROUVABLE') si la matière n'existe pas
     * @throws \RuntimeException('CRENEAU_INTROUVABLE') si l'un des créneaux est introuvable
     */
    public function updateSchedule(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        if (array_key_exists('id_classe', $data) || array_key_exists('classe', $data)) {
            $resolvedClassId = $this->resolveClassId($data['id_classe'] ?? $data['classe']);
            if ($resolvedClassId === null) {
                throw new \RuntimeException('CLASSE_INTROUVABLE');
            }
            $data['id_classe'] = $resolvedClassId;
            unset($data['classe']);
        }

        if (array_key_exists('id_matiere', $data) || array_key_exists('matiere', $data)) {
            $resolvedMatiereId = $this->resolveMatiereId($data['id_matiere'] ?? $data['matiere']);
            if ($resolvedMatiereId === null) {
                throw new \RuntimeException('MATIERE_INTROUVABLE');
            }
            $data['id_matiere'] = $resolvedMatiereId;
            unset($data['matiere']);
        }

        if (array_key_exists('id_creneau_debut', $data) || array_key_exists('heure_debut', $data)) {
            $resolvedCreneauDebutId = $this->resolveCreneauId($data['id_creneau_debut'] ?? $data['heure_debut']);
            if ($resolvedCreneauDebutId === null) {
                throw new \RuntimeException('CRENEAU_INTROUVABLE');
            }
            $data['id_creneau_debut'] = $resolvedCreneauDebutId;
            unset($data['heure_debut']);
        }

        if (array_key_exists('id_creneau_fin', $data) || array_key_exists('heure_fin', $data)) {
            $resolvedCreneauFinId = $this->resolveCreneauId($data['id_creneau_fin'] ?? $data['heure_fin']);
            if ($resolvedCreneauFinId === null) {
                throw new \RuntimeException('CRENEAU_INTROUVABLE');
            }
            $data['id_creneau_fin'] = $resolvedCreneauFinId;
            unset($data['heure_fin']);
        }

        $setClauses = [];
        $params = [':id' => $id];
        foreach (['id_classe', 'id_matiere', 'jour_semaine', 'id_creneau_debut', 'id_creneau_fin', 'salle'] as $field) {
            if (array_key_exists($field, $data)) {
                $setClauses[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        if (empty($setClauses)) return false;
        $stmt = $pdo->prepare(
            "UPDATE horaires_cours SET " . implode(', ', $setClauses) . " WHERE id = :id"
        );
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function deleteSchedule(int $id): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM horaires_cours WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }
}

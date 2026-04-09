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

    private function resolveCreneauId($creneauValue): ?int {
        return $this->timeSlotModel->resolveId($creneauValue);
    }

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

    public function getAllCreneaux(): array {
        return $this->timeSlotModel->getAll();
    }

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

    public function addSchedule(array $data): bool {
        $pdo = $this->db->getPdo();
        $classId = $this->resolveClassId($data['id_classe'] ?? ($data['classe'] ?? null));
        $matiereId = $this->resolveMatiereId($data['id_matiere'] ?? ($data['matiere'] ?? null));
        $creneauDebutId = $this->resolveCreneauId($data['id_creneau_debut'] ?? ($data['heure_debut'] ?? null));
        $creneauFinId = $this->resolveCreneauId($data['id_creneau_fin'] ?? ($data['heure_fin'] ?? null));
        if ($classId === null || $matiereId === null || $creneauDebutId === null || $creneauFinId === null) {
            return false;
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

    public function updateSchedule(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        if (array_key_exists('id_classe', $data) || array_key_exists('classe', $data)) {
            $resolvedClassId = $this->resolveClassId($data['id_classe'] ?? $data['classe']);
            if ($resolvedClassId === null) {
                return false;
            }
            $data['id_classe'] = $resolvedClassId;
            unset($data['classe']);
        }

        if (array_key_exists('id_matiere', $data) || array_key_exists('matiere', $data)) {
            $resolvedMatiereId = $this->resolveMatiereId($data['id_matiere'] ?? $data['matiere']);
            if ($resolvedMatiereId === null) {
                return false;
            }
            $data['id_matiere'] = $resolvedMatiereId;
            unset($data['matiere']);
        }

        if (array_key_exists('id_creneau_debut', $data) || array_key_exists('heure_debut', $data)) {
            $resolvedCreneauDebutId = $this->resolveCreneauId($data['id_creneau_debut'] ?? $data['heure_debut']);
            if ($resolvedCreneauDebutId === null) {
                return false;
            }
            $data['id_creneau_debut'] = $resolvedCreneauDebutId;
            unset($data['heure_debut']);
        }

        if (array_key_exists('id_creneau_fin', $data) || array_key_exists('heure_fin', $data)) {
            $resolvedCreneauFinId = $this->resolveCreneauId($data['id_creneau_fin'] ?? $data['heure_fin']);
            if ($resolvedCreneauFinId === null) {
                return false;
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

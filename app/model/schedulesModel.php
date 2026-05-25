<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class SchedulesModel {
    private DataBase $db;
    private ClassesModel $classesModel;
    private ClassroomModel $classroomModel;
    private CourseModel $courseModel;
    private TeachersModel $teachersModel;
    private TimeSlotModel $timeSlotModel;

    public function __construct() {
        $this->db = new DataBase();
        $this->classesModel = new ClassesModel();
        $this->classroomModel = new ClassroomModel();
        $this->courseModel = new CourseModel();
        $this->teachersModel = new TeachersModel();
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
    private function resolveCreneauId($creneauValue, string $type): ?int {
        return $this->timeSlotModel->resolveId($creneauValue, $type);
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

            if (!isset($schedule['professeur']) && isset($schedule['id_professeur'])) {
                $teacher = $this->teachersModel->getTeacherById((int)$schedule['id_professeur']);
                $schedule['professeur'] = trim(($teacher['nom'] ?? '') . ' ' . ($teacher['prenom'] ?? '')) ?: ($teacher['username'] ?? null);
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
        return $this->timeSlotModel->getAllGrouped();
    }

    public function addSlot(string $type, string $creneau): bool {
        return $this->timeSlotModel->addSlot($type, $creneau);
    }

    public function updateSlot(string $type, int $id, string $creneau): bool {
        return $this->timeSlotModel->updateSlot($type, $id, $creneau);
    }

    public function deleteSlot(string $type, int $id): bool {
        return $this->timeSlotModel->deleteSlot($type, $id);
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
     * Resout une valeur (id ou nom) en identifiant de local.
     *
     * @param mixed $localValue
     * @return int|null
     */
    private function resolveLocalId($localValue): ?int {
        if ($localValue === null || $localValue === '') {
            return null;
        }

        if (is_numeric($localValue)) {
            $classroom = $this->classroomModel->getClassroomById((int)$localValue);
            return $classroom ? (int)$classroom['id_local'] : null;
        }

        $classroom = $this->classroomModel->getClassroomByName((string)$localValue);
        return $classroom ? (int)$classroom['id_local'] : null;
    }

    /**
     * Résout une valeur (id ou nom affiché) en identifiant de professeur.
     *
     * @param mixed $teacherValue
     * @return int|null
     */
    private function resolveTeacherId($teacherValue): ?int {
        if ($teacherValue === null || $teacherValue === '') {
            return null;
        }

        if (is_numeric($teacherValue)) {
            $teacher = $this->teachersModel->getTeacherById((int)$teacherValue);
            return $teacher ? (int)$teacher['id_professeur'] : null;
        }

        $teacherValue = trim((string)$teacherValue);
        if ($teacherValue === '') {
            return null;
        }

        foreach ($this->teachersModel->getAllTeachers() as $teacher) {
            $fullName = trim(($teacher['nom'] ?? '') . ' ' . ($teacher['prenom'] ?? ''));
            if ($fullName !== '' && strcasecmp($fullName, $teacherValue) === 0) {
                return (int)$teacher['id_professeur'];
            }

            if (!empty($teacher['username']) && strcasecmp((string)$teacher['username'], $teacherValue) === 0) {
                return (int)$teacher['id_professeur'];
            }
        }

        return null;
    }

    /**
     * Trouve le créneau de fin correspondant à +50 minutes du créneau de début.
     *
     * @param int $startSlotId
     * @return int|null
     */
    private function findEndSlotIdPlus50Minutes(int $startSlotId): ?int {
        $startRow = $this->timeSlotModel->getById($startSlotId, 'debut');
        $startTime = $startRow['creneau'] ?? null;
        if (!is_string($startTime) || $startTime === '') {
            return null;
        }

        $date = \DateTime::createFromFormat('H:i:s', $startTime)
            ?: \DateTime::createFromFormat('H:i', $startTime);

        if (!$date) {
            return null;
        }

        $endTime = $date->modify('+50 minutes')->format('H:i:s');
        $endRow = $this->timeSlotModel->getByTime($endTime, 'fin');
        if (!$endRow) {
            return null;
        }

        return (int)($endRow['id_creneau'] ?? 0) ?: null;
    }

    private function getScheduleRowById(int $id): ?array {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare('SELECT * FROM horaires_cours WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Remplace l'horaire complet d'une classe à partir d'une grille hebdomadaire.
     * Chaque cellule contient un couple (jour, créneau début) et éventuellement une matière.
     * Le créneau de fin est calculé automatiquement à +50 minutes.
     *
     * @param array $data
     * @return array{deleted:int, inserted:int}
     */
    public function saveClassScheduleGrid(array $data): array {
        $pdo = $this->db->getPdo();
        $classId = $this->resolveClassId($data['id_classe'] ?? ($data['classe'] ?? null));
        if ($classId === null) {
            throw new \RuntimeException('CLASSE_INTROUVABLE');
        }

        $entries = is_array($data['entries'] ?? null) ? $data['entries'] : [];
        $allowedDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        $prepared = [];

        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $matiereRaw = $entry['id_matiere'] ?? ($entry['matiere'] ?? null);
            if ($matiereRaw === null || $matiereRaw === '') {
                // Cellule vide: rien à enregistrer.
                continue;
            }

            $matiereId = $this->resolveMatiereId($matiereRaw);
            if ($matiereId === null) {
                throw new \RuntimeException('MATIERE_INTROUVABLE');
            }

            $dayRaw = strtolower(trim((string)($entry['jour_semaine'] ?? '')));
            $day = $this->convertDayToFrench($dayRaw);
            if (!in_array($day, $allowedDays, true)) {
                throw new \RuntimeException('JOUR_INVALIDE');
            }

            $startId = $this->resolveCreneauId(
                $entry['id_creneau_debut'] ?? ($entry['heure_debut'] ?? null),
                'debut'
            );
            if ($startId === null) {
                throw new \RuntimeException('CRENEAU_INTROUVABLE');
            }

            $endId = $this->findEndSlotIdPlus50Minutes($startId);
            if ($endId === null) {
                throw new \RuntimeException('CRENEAU_FIN_INTROUVABLE');
            }

            $key = $day . '|' . $startId;
            $prepared[$key] = [
                'jour_semaine' => $day,
                'id_creneau_debut' => $startId,
                'id_creneau_fin' => $endId,
                'id_matiere' => $matiereId,
                'id_local' => $this->resolveLocalId($entry['id_local'] ?? ($entry['local'] ?? null)),
                'id_professeur' => $this->resolveTeacherId($entry['id_professeur'] ?? ($entry['professeur'] ?? null)),
            ];
        }

        $deleted = 0;
        $inserted = 0;

        $oldStmt = $pdo->prepare('SELECT * FROM horaires_cours WHERE id_classe = :id_classe ORDER BY jour_semaine, id_creneau_debut');
        $oldStmt->execute([':id_classe' => $classId]);
        $oldRows = $oldStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        try {
            $pdo->beginTransaction();

            $deleteStmt = $pdo->prepare('DELETE FROM horaires_cours WHERE id_classe = :id_classe');
            $deleteStmt->execute([':id_classe' => $classId]);
            $deleted = $deleteStmt->rowCount();

            if (!empty($prepared)) {
                $insertStmt = $pdo->prepare(
                    "INSERT INTO horaires_cours (id_classe, id_matiere, jour_semaine, id_creneau_debut, id_creneau_fin, id_local, id_professeur)
                     VALUES (:id_classe, :id_matiere, :jour_semaine, :id_creneau_debut, :id_creneau_fin, :id_local, :id_professeur)"
                );

                foreach ($prepared as $row) {
                    $insertStmt->execute([
                        ':id_classe' => $classId,
                        ':id_matiere' => $row['id_matiere'],
                        ':jour_semaine' => $row['jour_semaine'],
                        ':id_creneau_debut' => $row['id_creneau_debut'],
                        ':id_creneau_fin' => $row['id_creneau_fin'],
                        ':id_local' => $row['id_local'],
                        ':id_professeur' => $row['id_professeur'],
                    ]);
                    $inserted++;
                }
            }

            $pdo->commit();
            \App\Service\AuditService::logDbChange(
                'update',
                'horaires_cours',
                $oldRows,
                array_values($prepared),
                [
                    'mode' => 'grid_replace',
                    'id_classe' => $classId,
                    'deleted' => $deleted,
                    'inserted' => $inserted,
                ]
            );
            return ['deleted' => $deleted, 'inserted' => $inserted];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
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
    *                    id_creneau_fin (ou heure_fin), id_local (ou local) optionnel
     * @return bool true si la ligne a été insérée
     * @throws \RuntimeException('CLASSE_INTROUVABLE')  si la classe n'existe pas
     * @throws \RuntimeException('MATIERE_INTROUVABLE') si la matière n'existe pas
     * @throws \RuntimeException('CRENEAU_INTROUVABLE') si l'un des créneaux est introuvable
     * @throws \RuntimeException('LOCAL_INTROUVABLE') si le local fourni n'existe pas
     */
    public function addSchedule(array $data): bool {
        $pdo = $this->db->getPdo();
        $classId = $this->resolveClassId($data['id_classe'] ?? ($data['classe'] ?? null));
        $matiereId = $this->resolveMatiereId($data['id_matiere'] ?? ($data['matiere'] ?? null));
        $creneauDebutId = $this->resolveCreneauId($data['id_creneau_debut'] ?? ($data['heure_debut'] ?? null), 'debut');
        $creneauFinId = $this->resolveCreneauId($data['id_creneau_fin'] ?? ($data['heure_fin'] ?? null), 'fin');
        $rawLocal = $data['id_local'] ?? ($data['local'] ?? null);
        $localId = $this->resolveLocalId($rawLocal);
        $rawTeacher = $data['id_professeur'] ?? ($data['professeur'] ?? null);
        $teacherId = $this->resolveTeacherId($rawTeacher);
        if ($classId === null) {
            throw new \RuntimeException('CLASSE_INTROUVABLE');
        }
        if ($matiereId === null) {
            throw new \RuntimeException('MATIERE_INTROUVABLE');
        }
        if ($creneauDebutId === null || $creneauFinId === null) {
            throw new \RuntimeException('CRENEAU_INTROUVABLE');
        }
        if ($rawLocal !== null && $rawLocal !== '' && $localId === null) {
            throw new \RuntimeException('LOCAL_INTROUVABLE');
        }
        if ($rawTeacher !== null && $rawTeacher !== '' && $teacherId === null) {
            throw new \RuntimeException('PROFESSEUR_INTROUVABLE');
        }
        $stmt = $pdo->prepare(
            "INSERT INTO horaires_cours (id_classe, id_matiere, jour_semaine, id_creneau_debut, id_creneau_fin, id_local, id_professeur)
             VALUES (:id_classe, :id_matiere, :jour_semaine, :id_creneau_debut, :id_creneau_fin, :id_local, :id_professeur)"
        );
        try {
            $stmt->execute([
                ':id_classe'    => $classId,
                ':id_matiere'   => $matiereId,
                ':jour_semaine' => $data['jour_semaine'] ?? '',
                ':id_creneau_debut' => $creneauDebutId,
                ':id_creneau_fin'   => $creneauFinId,
                ':id_local'     => $localId,
                ':id_professeur' => $teacherId,
            ]);
            if ($stmt->rowCount() > 0) {
                $newId = (int)$pdo->lastInsertId();
                $new = $newId > 0 ? $this->getScheduleRowById($newId) : null;
                \App\Service\AuditService::logDbChange('insert', 'horaires_cours', null, $new ?: $data);
            }
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
    *                    id_creneau_fin/heure_fin, id_local (ou local), id_professeur (ou professeur)
     * @return bool true si la ligne a été modifiée
     * @throws \RuntimeException('CLASSE_INTROUVABLE')  si la classe n'existe pas
     * @throws \RuntimeException('MATIERE_INTROUVABLE') si la matière n'existe pas
     * @throws \RuntimeException('CRENEAU_INTROUVABLE') si l'un des créneaux est introuvable
     * @throws \RuntimeException('LOCAL_INTROUVABLE') si le local fourni n'existe pas
     */
    public function updateSchedule(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $old = $this->getScheduleRowById($id);
        if (!$old) {
            return false;
        }
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
            $resolvedCreneauDebutId = $this->resolveCreneauId($data['id_creneau_debut'] ?? $data['heure_debut'], 'debut');
            if ($resolvedCreneauDebutId === null) {
                throw new \RuntimeException('CRENEAU_INTROUVABLE');
            }
            $data['id_creneau_debut'] = $resolvedCreneauDebutId;
            unset($data['heure_debut']);
        }

        if (array_key_exists('id_creneau_fin', $data) || array_key_exists('heure_fin', $data)) {
            $resolvedCreneauFinId = $this->resolveCreneauId($data['id_creneau_fin'] ?? $data['heure_fin'], 'fin');
            if ($resolvedCreneauFinId === null) {
                throw new \RuntimeException('CRENEAU_INTROUVABLE');
            }
            $data['id_creneau_fin'] = $resolvedCreneauFinId;
            unset($data['heure_fin']);
        }

        if (array_key_exists('id_local', $data) || array_key_exists('local', $data)) {
            $rawLocal = $data['id_local'] ?? $data['local'];
            $resolvedLocalId = $this->resolveLocalId($rawLocal);
            if ($rawLocal !== null && $rawLocal !== '' && $resolvedLocalId === null) {
                throw new \RuntimeException('LOCAL_INTROUVABLE');
            }
            $data['id_local'] = $resolvedLocalId;
            unset($data['local']);
        }

        if (array_key_exists('id_professeur', $data) || array_key_exists('professeur', $data)) {
            $rawTeacher = $data['id_professeur'] ?? $data['professeur'];
            $resolvedTeacherId = $this->resolveTeacherId($rawTeacher);
            if ($rawTeacher !== null && $rawTeacher !== '' && $resolvedTeacherId === null) {
                throw new \RuntimeException('PROFESSEUR_INTROUVABLE');
            }
            $data['id_professeur'] = $resolvedTeacherId;
            unset($data['professeur']);
        }

        $setClauses = [];
        $params = [':id' => $id];
        foreach (['id_classe', 'id_matiere', 'jour_semaine', 'id_creneau_debut', 'id_creneau_fin', 'id_local', 'id_professeur'] as $field) {
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
        if ($stmt->rowCount() > 0) {
            $new = $this->getScheduleRowById($id);
            \App\Service\AuditService::logDbChange('update', 'horaires_cours', $old, $new);
        }
        return $stmt->rowCount() > 0;
    }

    public function deleteSchedule(int $id): bool {
        $pdo = $this->db->getPdo();
        $old = $this->getScheduleRowById($id);
        $stmt = $pdo->prepare("DELETE FROM horaires_cours WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() > 0) {
            \App\Service\AuditService::logDbChange('delete', 'horaires_cours', $old, null);
        }
        return $stmt->rowCount() > 0;
    }
}

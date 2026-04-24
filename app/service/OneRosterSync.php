<?php
namespace App\Service;

/**
 * [CONSERVÉ – NON UTILISÉ EN PRODUCTION]
 *
 * OneRosterSync — Service de synchronisation OneRoster V1.1 → base de données
 * ==========================================================================
 *
 * Ce service a été remplacé par SmartschoolSync (SOAP V3) comme service de sync
 * principal au login. Il est conservé à titre documentaire et de fallback.
 *
 * ## Fonctionnement général
 *
 * Au login, authController appelait $this->oneRosterSync->syncAll() qui enchaîne :
 *   1. syncStudents()  : récupère les élèves via OneRosterClient::getStudents()
 *   2. syncTeachers()  : récupère les enseignants via OneRosterClient::getTeachers()
 *   3. syncSchedules() : récupère les horaires via OneRosterClient::getSchedules()
 *
 * ## Source de données
 *
 * API OneRoster V1.1 OAuth2 (client_credentials)
 * URL : https://centreleonarddefrance.smartschool.be/ims/oneroster/v1p1
 * Config : app/config/oneroster.php
 *
 * Endpoints utilisés :
 *   - POST /token                      : obtenir le bearer token
 *   - GET  /students                   : liste des élèves (fallback : /users?role=student)
 *   - GET  /teachers                   : liste des enseignants (fallback : /users?role=teacher, /users?role=staff)
 *   - GET  /classschedules             : horaires (fallback : /classSchedules, /schedules, /classeschedules)
 *
 * ## Champ pivot d'identité
 *
 * Le champ `sourcedId` OneRoster (format UUID ou identifiant alphanumérique) est stocké
 * dans la colonne `sourcedId` des tables `etudiants` et `professeurs`.
 *
 * ## Mapping étudiants
 *   user.sourcedId    → etudiants.sourcedId
 *   user.familyName   → etudiants.nom
 *   user.givenName    → etudiants.prenom
 *   user.metadata.smsc.classInfo → etudiants.classe (nom de classe)
 *   user.birthDate    → etudiants.date_naissance
 *
 * ## Mapping enseignants
 *   user.sourcedId    → professeurs.sourcedId
 *   user.familyName   → professeurs.nom
 *   user.givenName    → professeurs.prenom
 *   user.email        → professeurs.email
 *   user.username     → professeurs.username
 *   user.enabledUser  → professeurs.enabled_user
 *
 * ## Mapping horaires
 *   row.className / metadata.smsc.classInfo → horaires_cours.id_classe
 *   row.subject / courseName                → horaires_cours.id_matiere
 *   row.dayOfWeek                           → horaires_cours.jour_semaine
 *   row.startTime                           → horaires_cours.id_creneau_debut
 *   row.endTime                             → horaires_cours.id_creneau_fin
 *   row.teacherSourcedId                    → horaires_cours.id_professeur
 *
 * ## Problèmes réseau rencontrés
 *
 * L'endpoint token (POST /token) répond correctement (~800 ms).
 * Les endpoints GET données souffrent de timeouts intermittents (~21 s) vers
 * centreleonarddefrance.smartschool.be:443. La connectivité TCP réseau est instable
 * selon les moments. C'est la raison principale du basculement vers SOAP V3.
 *
 * Pour diagnostiquer : php test/oneroster_diag.php --force-ip=193.56.132.11 --retries=3
 */

use App\Core\DataBase;
use App\Model\ClassesModel;
use App\Model\CourseModel;
use App\Model\StudentsModel;
use App\Model\TeachersModel;
use App\Model\TimeSlotModel;
use PDO;

class OneRosterSync {
    private OneRosterClient $client;
    private StudentsModel $studentsModel;
    private TeachersModel $teachersModel;
    private ClassesModel $classesModel;
    private CourseModel $courseModel;
    private TimeSlotModel $timeSlotModel;
    private DataBase $db;
    private ?bool $hasScheduleTeacherColumn = null;
    private ?bool $hasMatiereTeachersTable = null;

    public function __construct() {
        $this->client = new OneRosterClient();
        $this->studentsModel = new StudentsModel();
        $this->teachersModel = new TeachersModel();
        $this->classesModel = new ClassesModel();
        $this->courseModel = new CourseModel();
        $this->timeSlotModel = new TimeSlotModel();
        $this->db = new DataBase();
    }

    /**
     * Execute toutes les synchronisations disponibles.
     *
     * @return array<string,array<string,int>>
     */
    public function syncAll(bool $dryRun = false): array {
        return [
            'students' => $this->syncStudents($dryRun),
            'teachers' => $this->syncTeachers($dryRun),
            'schedules' => $this->syncSchedules($dryRun),
        ];
    }

    /**
     * Synchronise les etudiants OneRoster vers la table etudiants.
     *
     * @return array<string,int>
     */
    public function syncStudents(bool $dryRun = false): array {
        $payload = $this->client->getStudents();
        $users = $payload['users'] ?? [];

        $stats = [
            'total' => 0,
            'inserted' => 0,
            'updated' => 0,
            'unchanged' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        foreach ($users as $user) {
            $stats['total']++;

            $sourcedId = trim((string)($user['sourcedId'] ?? ''));
            if ($sourcedId === '') {
                $stats['skipped']++;
                continue;
            }

            $mapped = $this->mapUserToStudentData($user);
            $existing = $this->studentsModel->getStudentBySourcedId($sourcedId);

            if ($existing) {
                if ($dryRun) {
                    $stats['updated']++;
                    continue;
                }

                try {
                    $updated = $this->studentsModel->updateStudentBySourcedId($sourcedId, $mapped);
                    if ($updated) {
                        $stats['updated']++;
                    } else {
                        $stats['unchanged']++;
                    }
                } catch (\Throwable $e) {
                    $stats['errors']++;
                    error_log('[OneRosterSync] update error for ' . $sourcedId . ': ' . $e->getMessage());
                }
                continue;
            }

            if ($dryRun) {
                $stats['inserted']++;
                continue;
            }

            try {
                $created = $this->studentsModel->createStudent($mapped);
                if ($created) {
                    $stats['inserted']++;
                } else {
                    $stats['errors']++;
                }
            } catch (\Throwable $e) {
                $stats['errors']++;
                error_log('[OneRosterSync] create error for ' . $sourcedId . ': ' . $e->getMessage());
            }
        }

        return $stats;
    }

    /**
     * Synchronise les professeurs OneRoster vers la table professeurs.
     *
     * @return array<string,int>
     */
    public function syncTeachers(bool $dryRun = false): array {
        $payload = $this->client->getTeachers();
        $users = $payload['users'] ?? $payload['teachers'] ?? [];

        $stats = [
            'total' => 0,
            'inserted' => 0,
            'updated' => 0,
            'unchanged' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        foreach ($users as $user) {
            $stats['total']++;

            $sourcedId = trim((string)($user['sourcedId'] ?? ''));
            if ($sourcedId === '') {
                $stats['skipped']++;
                continue;
            }

            $mapped = $this->mapUserToTeacherData($user);
            $existing = $this->teachersModel->getTeacherBySourcedId($sourcedId);

            if ($existing) {
                if ($dryRun) {
                    $stats['updated']++;
                    continue;
                }

                try {
                    $updated = $this->teachersModel->updateTeacherBySourcedId($sourcedId, $mapped);
                    if ($updated) {
                        $stats['updated']++;
                    } else {
                        $stats['unchanged']++;
                    }
                } catch (\Throwable $e) {
                    $stats['errors']++;
                    error_log('[OneRosterSync] teacher update error for ' . $sourcedId . ': ' . $e->getMessage());
                }
                continue;
            }

            if ($dryRun) {
                $stats['inserted']++;
                continue;
            }

            try {
                $created = $this->teachersModel->createTeacher($mapped);
                if ($created) {
                    $stats['inserted']++;
                } else {
                    $stats['errors']++;
                }
            } catch (\Throwable $e) {
                $stats['errors']++;
                error_log('[OneRosterSync] teacher create error for ' . $sourcedId . ': ' . $e->getMessage());
            }
        }

        return $stats;
    }

    /**
     * Synchronise les horaires OneRoster vers la table horaires_cours.
     *
     * @return array<string,int>
     */
    public function syncSchedules(bool $dryRun = false): array {
        $payload = $this->client->getSchedules();
        $rows = $this->extractScheduleRows($payload);

        $stats = [
            'total' => 0,
            'inserted' => 0,
            'updated' => 0,
            'unchanged' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        foreach ($rows as $row) {
            $stats['total']++;
            $mapped = $this->mapScheduleRow($row);

            if (
                empty($mapped['classe']) ||
                empty($mapped['matiere']) ||
                empty($mapped['jour_semaine']) ||
                empty($mapped['heure_debut']) ||
                empty($mapped['heure_fin'])
            ) {
                $stats['skipped']++;
                continue;
            }

            if ($dryRun) {
                $stats['updated']++;
                continue;
            }

            try {
                $result = $this->upsertSchedule($mapped);
                $stats[$result]++;
            } catch (\Throwable $e) {
                $stats['errors']++;
                error_log('[OneRosterSync] schedule upsert error: ' . $e->getMessage());
            }
        }

        return $stats;
    }

    /**
     * @param array<string,mixed> $user
     * @return array<string,mixed>
     */
    private function mapUserToStudentData(array $user): array {
        $birthDate = $this->normalizeBirthDate($user['birthDate'] ?? null);
        $classInfo = $user['metadata']['smsc.classInfo'] ?? null;

        return [
            'sourcedId' => (string)($user['sourcedId'] ?? ''),
            'nom' => (string)($user['familyName'] ?? ''),
            'prenom' => (string)($user['givenName'] ?? ''),
            'classe' => (is_string($classInfo) && trim($classInfo) !== '') ? trim($classInfo) : null,
            'date_naissance' => $birthDate,
            'autorisation_midi' => 0,
        ];
    }

    /**
     * @param array<string,mixed> $user
     * @return array<string,mixed>
     */
    private function mapUserToTeacherData(array $user): array {
        return [
            'sourcedId' => (string)($user['sourcedId'] ?? ''),
            'nom' => (string)($user['familyName'] ?? ''),
            'prenom' => (string)($user['givenName'] ?? ''),
            'email' => isset($user['email']) ? (string)$user['email'] : null,
            'username' => isset($user['username']) ? (string)$user['username'] : null,
            'enabled_user' => !empty($user['enabledUser']) ? 1 : 0,
        ];
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<int,array<string,mixed>>
     */
    private function extractScheduleRows(array $payload): array {
        foreach (['classSchedules', 'schedules', 'results', 'items'] as $key) {
            if (isset($payload[$key]) && is_array($payload[$key])) {
                return $payload[$key];
            }
        }

        return [];
    }

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function mapScheduleRow(array $row): array {
        $className = $this->firstNonEmptyString([
            $row['className'] ?? null,
            $row['class'] ?? null,
            $row['metadata']['smsc.classInfo'] ?? null,
            $row['metadata']['className'] ?? null,
        ]);

        $subject = $this->firstNonEmptyString([
            $row['subject'] ?? null,
            $row['courseName'] ?? null,
            $row['course'] ?? null,
            $row['metadata']['subject'] ?? null,
        ]);

        $day = $this->normalizeDayName($this->firstNonEmptyString([
            $row['dayOfWeek'] ?? null,
            $row['day'] ?? null,
            $row['jour_semaine'] ?? null,
        ]));

        $startTime = $this->normalizeTime($this->firstNonEmptyString([
            $row['startTime'] ?? null,
            $row['start'] ?? null,
            $row['heure_debut'] ?? null,
        ]));

        $endTime = $this->normalizeTime($this->firstNonEmptyString([
            $row['endTime'] ?? null,
            $row['end'] ?? null,
            $row['heure_fin'] ?? null,
        ]));

        $teacherSourcedId = $this->firstNonEmptyString([
            $row['teacherSourcedId'] ?? null,
            $row['teacher'] ?? null,
            $row['metadata']['teacherSourcedId'] ?? null,
        ]);

        return [
            'classe' => $className,
            'matiere' => $subject,
            'jour_semaine' => $day,
            'heure_debut' => $startTime,
            'heure_fin' => $endTime,
            'salle' => $this->firstNonEmptyString([
                $row['room'] ?? null,
                $row['location'] ?? null,
                $row['salle'] ?? null,
            ]),
            'teacher_sourcedId' => $teacherSourcedId,
        ];
    }

    private function firstNonEmptyString(array $values): ?string {
        foreach ($values as $value) {
            if (is_string($value)) {
                $trimmed = trim($value);
                if ($trimmed !== '') {
                    return $trimmed;
                }
            }
        }

        return null;
    }

    private function normalizeDayName(?string $day): ?string {
        if ($day === null) {
            return null;
        }

        $key = strtolower(trim($day));
        $mapping = [
            'monday' => 'lundi',
            'tuesday' => 'mardi',
            'wednesday' => 'mercredi',
            'thursday' => 'jeudi',
            'friday' => 'vendredi',
            'saturday' => 'samedi',
            'sunday' => 'dimanche',
            'lundi' => 'lundi',
            'mardi' => 'mardi',
            'mercredi' => 'mercredi',
            'jeudi' => 'jeudi',
            'vendredi' => 'vendredi',
            'samedi' => 'samedi',
            'dimanche' => 'dimanche',
        ];

        return $mapping[$key] ?? null;
    }

    private function normalizeTime(?string $time): ?string {
        if ($time === null) {
            return null;
        }

        $value = trim($time);
        if ($value === '') {
            return null;
        }

        if (preg_match('/^\d{2}:\d{2}$/', $value)) {
            return $value . ':00';
        }

        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $value)) {
            return $value;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}:\d{2})/', $value, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * @param array<string,mixed> $schedule
     * @return 'inserted'|'updated'|'unchanged'
     */
    private function upsertSchedule(array $schedule): string {
        $pdo = $this->db->getPdo();

        $classId = $this->ensureClassId((string)$schedule['classe']);
        $teacherId = $this->resolveTeacherIdBySourcedId($schedule['teacher_sourcedId'] ?? null);
        $matiereId = $this->ensureMatiereId((string)$schedule['matiere'], $teacherId);
        $debutId = $this->ensureCreneauId((string)$schedule['heure_debut']);
        $finId = $this->ensureCreneauId((string)$schedule['heure_fin']);

        $stmt = $pdo->prepare(
            "SELECT id, salle" . ($this->hasProfessorColumn() ? ", id_professeur" : "") . "
             FROM horaires_cours
             WHERE id_classe = :id_classe
               AND id_matiere = :id_matiere
               AND jour_semaine = :jour_semaine
               AND id_creneau_debut = :id_creneau_debut
               AND id_creneau_fin = :id_creneau_fin
             LIMIT 1"
        );

        $stmt->execute([
            ':id_classe' => $classId,
            ':id_matiere' => $matiereId,
            ':jour_semaine' => $schedule['jour_semaine'],
            ':id_creneau_debut' => $debutId,
            ':id_creneau_fin' => $finId,
        ]);

        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        $salle = $schedule['salle'] ?? null;

        if ($existing) {
            $currentSalle = $existing['salle'] ?? null;
            $currentTeacherId = $this->hasProfessorColumn() ? ($existing['id_professeur'] ?? null) : null;

            $isSameSalle = (string)($currentSalle ?? '') === (string)($salle ?? '');
            $isSameTeacher = !$this->hasProfessorColumn() || (string)($currentTeacherId ?? '') === (string)($teacherId ?? '');

            if ($isSameSalle && $isSameTeacher) {
                return 'unchanged';
            }

            if ($this->hasProfessorColumn()) {
                $update = $pdo->prepare(
                    "UPDATE horaires_cours
                     SET salle = :salle, id_professeur = :id_professeur
                     WHERE id = :id"
                );

                $update->execute([
                    ':salle' => $salle,
                    ':id_professeur' => $teacherId,
                    ':id' => $existing['id'],
                ]);
            } else {
                $update = $pdo->prepare(
                    "UPDATE horaires_cours
                     SET salle = :salle
                     WHERE id = :id"
                );

                $update->execute([
                    ':salle' => $salle,
                    ':id' => $existing['id'],
                ]);
            }

            return 'updated';
        }

        if ($this->hasProfessorColumn()) {
            $insert = $pdo->prepare(
                "INSERT INTO horaires_cours
                (jour_semaine, id_creneau_debut, id_creneau_fin, salle, id_matiere, id_classe, id_professeur)
                VALUES
                (:jour_semaine, :id_creneau_debut, :id_creneau_fin, :salle, :id_matiere, :id_classe, :id_professeur)"
            );

            $insert->execute([
                ':jour_semaine' => $schedule['jour_semaine'],
                ':id_creneau_debut' => $debutId,
                ':id_creneau_fin' => $finId,
                ':salle' => $salle,
                ':id_matiere' => $matiereId,
                ':id_classe' => $classId,
                ':id_professeur' => $teacherId,
            ]);
        } else {
            $insert = $pdo->prepare(
                "INSERT INTO horaires_cours
                (jour_semaine, id_creneau_debut, id_creneau_fin, salle, id_matiere, id_classe)
                VALUES
                (:jour_semaine, :id_creneau_debut, :id_creneau_fin, :salle, :id_matiere, :id_classe)"
            );

            $insert->execute([
                ':jour_semaine' => $schedule['jour_semaine'],
                ':id_creneau_debut' => $debutId,
                ':id_creneau_fin' => $finId,
                ':salle' => $salle,
                ':id_matiere' => $matiereId,
                ':id_classe' => $classId,
            ]);
        }

        return 'inserted';
    }

    private function ensureClassId(string $className): int {
        $normalized = trim($className);
        if ($normalized === '') {
            throw new \RuntimeException('Nom de classe vide');
        }

        if (strlen($normalized) > 10) {
            $normalized = substr($normalized, 0, 10);
        }

        $existing = $this->classesModel->getClassByName($normalized);
        if ($existing) {
            return (int)$existing['id_classe'];
        }

        $this->classesModel->addClass(['classe' => $normalized]);
        $created = $this->classesModel->getClassByName($normalized);
        if (!$created) {
            throw new \RuntimeException('Creation de classe impossible: ' . $normalized);
        }

        return (int)$created['id_classe'];
    }

    private function ensureMatiereId(string $matiere, ?int $teacherId = null): int {
        $normalized = trim($matiere);
        if ($normalized === '') {
            throw new \RuntimeException('Nom de matiere vide');
        }

        $existing = $this->courseModel->getMatiereByName($normalized);
        if ($existing) {
            if (
                $teacherId !== null &&
                $this->hasMatiereTeachersPivot()
            ) {
                $full = $this->courseModel->getMatiereById((int)$existing['id_matiere']);
                $teacherIds = is_array($full['id_professeurs'] ?? null) ? $full['id_professeurs'] : [];
                $teacherIds[] = $teacherId;
                $teacherIds = array_values(array_unique(array_map('intval', $teacherIds)));
                $this->courseModel->updateMatiere((int)$existing['id_matiere'], ['id_professeurs' => $teacherIds]);
            }

            return (int)$existing['id_matiere'];
        }

        $payload = ['matiere' => $normalized];
        if ($teacherId !== null && $this->hasMatiereTeachersPivot()) {
            $payload['id_professeurs'] = [$teacherId];
        }

        $this->courseModel->addMatiere($payload);
        $created = $this->courseModel->getMatiereByName($normalized);
        if (!$created) {
            throw new \RuntimeException('Creation de matiere impossible: ' . $normalized);
        }

        return (int)$created['id_matiere'];
    }

    private function ensureCreneauId(string $time): int {
        $row = $this->timeSlotModel->getByTime($time);
        if ($row) {
            return (int)$row['id_creneau'];
        }

        $pdo = $this->db->getPdo();
        $insert = $pdo->prepare("INSERT INTO creneau_horaire (creneau) VALUES (:creneau)");
        $insert->execute([':creneau' => $time]);

        $created = $this->timeSlotModel->getByTime($time);
        if (!$created) {
            throw new \RuntimeException('Creation du creneau impossible: ' . $time);
        }

        return (int)$created['id_creneau'];
    }

    private function resolveTeacherIdBySourcedId(?string $sourcedId): ?int {
        if ($sourcedId === null || trim($sourcedId) === '') {
            return null;
        }

        $teacher = $this->teachersModel->getTeacherBySourcedId(trim($sourcedId));
        if (!$teacher) {
            return null;
        }

        return (int)$teacher['id_professeur'];
    }

    private function hasProfessorColumn(): bool {
        if ($this->hasScheduleTeacherColumn !== null) {
            return $this->hasScheduleTeacherColumn;
        }

        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SHOW COLUMNS FROM horaires_cours LIKE 'id_professeur'");
        $this->hasScheduleTeacherColumn = (bool)$stmt->fetch(PDO::FETCH_ASSOC);

        return $this->hasScheduleTeacherColumn;
    }

    private function hasMatiereTeachersPivot(): bool {
        if ($this->hasMatiereTeachersTable !== null) {
            return $this->hasMatiereTeachersTable;
        }

        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SHOW TABLES LIKE 'matieres_professeurs'");
        $this->hasMatiereTeachersTable = (bool)$stmt->fetch(PDO::FETCH_NUM);

        return $this->hasMatiereTeachersTable;
    }

    private function normalizeBirthDate($value): ?string {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);
        if ($value === '') {
            return null;
        }

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : null;
    }
}

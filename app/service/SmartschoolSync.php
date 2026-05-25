<?php
namespace App\Service;

use App\Core\DataBase;
use App\Model\ClassesModel;
use App\Model\CourseModel;
use App\Model\StudentsModel;
use App\Model\TeachersModel;
use PDO;

/**
 * SmartschoolSync
 *
 * Synchronise les données Smartschool (SOAP V3) vers la base de données locale.
 * Remplace OneRosterSync comme service de sync principal au login.
 *
 * Source : SmartschoolWebServiceV3Client (SOAP V3)
 * Champ pivot d'identité : scannableCode (UUID) → sourcedId en DB
 *
 * Périmètre :
 *   - syncStudents() : groupe "Élèves" via getAllAccountsExtended, basisrol = 1
 *   - syncTeachers() : groupe "Enseignants" via getAllAccountsExtended, basisrol != 1
 *   - syncSchedules() : getCourses() → relations matière / enseignant / classes
 *                       (les créneaux horaires ne sont pas disponibles via SOAP V3,
 *                        seule la relation matière-enseignant-classe est synchronisée)
 */
class SmartschoolSync {
    private SmartschoolWebServiceV3Client $client;
    private StudentsModel $studentsModel;
    private TeachersModel $teachersModel;
    private ClassesModel $classesModel;
    private CourseModel $courseModel;
    private DataBase $db;
    private ?bool $hasMatiereTeachersTable = null;
    private bool $studentSchemaLogged = false;

    public function __construct(?SmartschoolWebServiceV3Client $client = null) {
        $this->client = $client ?? new SmartschoolWebServiceV3Client();
        $this->studentsModel = new StudentsModel();
        $this->teachersModel = new TeachersModel();
        $this->classesModel = new ClassesModel();
        $this->courseModel = new CourseModel();
        $this->db = new DataBase();
    }

    /**
     * Exécute toutes les synchronisations disponibles.
     *
     * @return array<string,array<string,int>>
     */
    public function syncAll(bool $dryRun = false): array {
        return [
            'students'  => $this->syncStudents($dryRun),
            'teachers'  => $this->syncTeachers($dryRun),
            'schedules' => $this->syncSchedules($dryRun),
        ];
    }

    /**
     * Synchronisation bornée pour le login (objectif UX: ne pas dépasser ~10s).
     * Exécute prioritairement teachers + schedules, et n'exécute students que si
     * le budget restant est suffisant.
     *
     * @return array<string,mixed>
     */
    public function syncForLogin(bool $dryRun = false, int $maxSeconds = 10): array {
        $maxSeconds = max(1, $maxSeconds);
        $startedAt = microtime(true);
        $deadline = $startedAt + $maxSeconds;

        $empty = ['total' => 0, 'inserted' => 0, 'updated' => 0, 'unchanged' => 0, 'skipped' => 0, 'errors' => 0];
        $stats = [
            'students' => $empty,
            'teachers' => $empty,
            'schedules' => $empty,
            '_meta' => [
                'timed_out' => false,
                'stages_run' => [],
                'stages_skipped' => [],
                'max_seconds' => $maxSeconds,
                'elapsed_ms' => 0,
            ],
        ];

        $runStage = function (string $name, callable $fn) use (&$stats, $deadline): void {
            if (microtime(true) >= $deadline) {
                $stats['_meta']['timed_out'] = true;
                $stats['_meta']['stages_skipped'][] = $name;
                return;
            }
            $stats[$name] = $fn();
            $stats['_meta']['stages_run'][] = $name;
        };

        // Priorité aux données les moins coûteuses et utiles immédiatement.
        $runStage('teachers', fn() => $this->syncTeachers($dryRun));
        $runStage('schedules', fn() => $this->syncSchedules($dryRun));

        // Etudiants: potentiellement coûteux (par classe). Ne lancer que s'il reste du temps.
        $remaining = $deadline - microtime(true);
        if ($remaining >= 4.0) {
            $runStage('students', fn() => $this->syncStudents($dryRun));
        } else {
            $stats['_meta']['stages_skipped'][] = 'students';
        }

        $stats['_meta']['elapsed_ms'] = (int)round((microtime(true) - $startedAt) * 1000);
        if (($stats['_meta']['elapsed_ms'] / 1000) >= $maxSeconds) {
            $stats['_meta']['timed_out'] = true;
        }

        return $stats;
    }

    /**
     * Synchronise les étudiants SOAP V3 vers la table etudiants.
     * Identifiant pivot : scannableCode → sourcedId
     *
     * @return array<string,int>
     */
    public function syncStudents(bool $dryRun = false): array {
        $users = $this->client->getStudents();

        $stats = ['total' => 0, 'inserted' => 0, 'updated' => 0,
                  'unchanged' => 0, 'skipped' => 0, 'errors' => 0];

        foreach ($users as $user) {
            $stats['total']++;

            if (!$this->studentSchemaLogged) {
                $this->logStudentSchemaSample($user);
                $this->studentSchemaLogged = true;
            }

            $sourcedId = trim((string)($user['scannableCode'] ?? ''));
            if ($sourcedId === '' || !StudentsModel::validateSourcedId($sourcedId)) {
                $stats['skipped']++;
                continue;
            }

            $mapped   = $this->mapUserToStudentData($user, $sourcedId);
            $existing = $this->studentsModel->getStudentBySourcedId($sourcedId);

            if ($existing) {
                if ($dryRun) { $stats['updated']++; continue; }
                try {
                    $updated = $this->studentsModel->updateStudentBySourcedId($sourcedId, $mapped);
                    $stats[$updated ? 'updated' : 'unchanged']++;
                } catch (\Throwable $e) {
                    $stats['errors']++;
                    error_log('[SmartschoolSync] student update error ' . $sourcedId . ': ' . $e->getMessage());
                }
                continue;
            }

            if ($dryRun) { $stats['inserted']++; continue; }
            try {
                $created = $this->studentsModel->createStudent($mapped);
                $stats[$created ? 'inserted' : 'errors']++;
            } catch (\Throwable $e) {
                $stats['errors']++;
                error_log('[SmartschoolSync] student create error ' . $sourcedId . ': ' . $e->getMessage());
            }
        }

        return $stats;
    }

    /**
     * Synchronise les enseignants SOAP V3 vers la table professeurs.
     * Identifiant pivot : scannableCode → sourcedId
     *
     * @return array<string,int>
     */
    public function syncTeachers(bool $dryRun = false): array {
        $users = $this->client->getTeachers();

        $stats = ['total' => 0, 'inserted' => 0, 'updated' => 0,
                  'unchanged' => 0, 'skipped' => 0, 'errors' => 0];

        foreach ($users as $user) {
            $stats['total']++;

            $sourcedId = trim((string)($user['scannableCode'] ?? ''));
            if ($sourcedId === '') {
                $stats['skipped']++;
                continue;
            }

            $mapped   = $this->mapUserToTeacherData($user, $sourcedId);
            $existing = $this->teachersModel->getTeacherBySourcedId($sourcedId);

            if ($existing) {
                if ($dryRun) { $stats['updated']++; continue; }
                try {
                    $updated = $this->teachersModel->updateTeacherBySourcedId($sourcedId, $mapped);
                    $stats[$updated ? 'updated' : 'unchanged']++;
                } catch (\Throwable $e) {
                    $stats['errors']++;
                    error_log('[SmartschoolSync] teacher update error ' . $sourcedId . ': ' . $e->getMessage());
                }
                continue;
            }

            if ($dryRun) { $stats['inserted']++; continue; }
            try {
                $created = $this->teachersModel->createTeacher($mapped);
                $stats[$created ? 'inserted' : 'errors']++;
            } catch (\Throwable $e) {
                $stats['errors']++;
                error_log('[SmartschoolSync] teacher create error ' . $sourcedId . ': ' . $e->getMessage());
            }
        }

        return $stats;
    }

    /**
     * Synchronise les relations cours / enseignant / classes depuis getCourses() SOAP.
     *
     * Note : SOAP V3 ne fournit pas les créneaux horaires (jour, heure début/fin).
     * Cette méthode synchronise uniquement :
     *   - L'existence des matières (table matieres)
     *   - Le lien matière ↔ enseignant (table matieres_professeurs si disponible)
     * Les lignes de horaires_cours ne sont pas créées ici (données insuffisantes).
     *
     * @return array<string,int>
     */
    public function syncSchedules(bool $dryRun = false): array {
        $courses = $this->client->getSchedules();

        $stats = ['total' => 0, 'inserted' => 0, 'updated' => 0,
                  'unchanged' => 0, 'skipped' => 0, 'errors' => 0];

        foreach ($courses as $course) {
            $stats['total']++;

            $courseName = trim((string)($course['courseName'] ?? ''));
            if ($courseName === '') {
                $stats['skipped']++;
                continue;
            }

            $teacherUsername = trim((string)($course['mainTeacherUsername'] ?? ''));
            $teacherId       = $this->resolveTeacherIdByUsername($teacherUsername);

            if ($dryRun) {
                $stats['updated']++;
                continue;
            }

                $description = ($course['description'] ?? '') !== '' ? (string)$course['description'] : null;
                $active      = ($course['active'] ?? '1') !== '0';
                try {
                    $result = $this->upsertCourseRelation($courseName, $teacherId, $description, $active);
                $stats[$result]++;
            } catch (\Throwable $e) {
                $stats['errors']++;
                error_log('[SmartschoolSync] course upsert error "' . $courseName . '": ' . $e->getMessage());
            }
        }

        return $stats;
    }

    // -------------------------------------------------------------------------
    // Mapping
    // -------------------------------------------------------------------------

    /**
     * @param array<string,mixed> $user
     * @return array<string,mixed>
     */
    private function mapUserToStudentData(array $user, string $sourcedId): array {
        // Chercher la classe officielle (isKlas = true) dans les groupes
        $classe = null;
        foreach ((array)($user['groups'] ?? []) as $g) {
            if (!empty($g['isKlas']) && trim((string)($g['code'] ?? '')) !== '') {
                $classe = trim((string)$g['code']);
                break;
            }
        }

        $birthDate = $this->normalizeBirthDate($user['geboortedatum'] ?? null);
        $autorisationMidi = $this->resolveAutorisationMidiFromUser($user);

        return [
            'sourcedId'        => $sourcedId,
            'internnummer'        => ($user['internnummer'] ?? '') !== '' ? (string)$user['internnummer'] : null,
            'stamboeknummer'      => ($user['stamboeknummer'] ?? '') !== '' ? (string)$user['stamboeknummer'] : null,
            'referenceIdentifier' => ($user['referenceIdentifier'] ?? '') !== '' ? (string)$user['referenceIdentifier'] : null,
            'gebruikersnaam'      => ($user['gebruikersnaam'] ?? '') !== '' ? (string)$user['gebruikersnaam'] : null,
            'geslacht'            => ($user['geslacht'] ?? '') !== '' ? (string)$user['geslacht'] : null,
            'emailadres'          => ($user['emailadres'] ?? '') !== '' ? (string)$user['emailadres'] : null,
            'nom'                 => (string)($user['naam'] ?? ''),
            'prenom'              => (string)($user['voornaam'] ?? ''),
            'classe'              => $classe,
            'date_naissance'      => $birthDate,
            'autorisation_midi'   => $autorisationMidi,
        ];
    }

    /**
     * @param array<string,mixed> $user
     * @return array<string,mixed>
     */
    private function mapUserToTeacherData(array $user, string $sourcedId): array {
        return [
            'sourcedId'           => $sourcedId,
            'internnummer'        => ($user['internnummer'] ?? '') !== '' ? (string)$user['internnummer'] : null,
            'stamboeknummer'      => ($user['stamboeknummer'] ?? '') !== '' ? (string)$user['stamboeknummer'] : null,
            'referenceIdentifier' => ($user['referenceIdentifier'] ?? '') !== '' ? (string)$user['referenceIdentifier'] : null,
            'nom'                 => (string)($user['naam'] ?? ''),
            'prenom'              => (string)($user['voornaam'] ?? ''),
            'email'               => ($user['emailadres'] ?? '') !== '' ? (string)$user['emailadres'] : null,
            'username'            => ($user['gebruikersnaam'] ?? '') !== '' ? (string)$user['gebruikersnaam'] : null,
            'enabled_user'        => ((string)($user['status'] ?? '')) === 'actief' ? 1 : 0,
        ];
    }

    // -------------------------------------------------------------------------
    // Helpers DB
    // -------------------------------------------------------------------------

    /**
     * Crée ou met à jour une matière et son lien vers l'enseignant.
     *
     * @return 'inserted'|'updated'|'unchanged'
     */
    private function upsertCourseRelation(string $courseName, ?int $teacherId, ?string $description = null, bool $active = true): string {
        $existing = $this->courseModel->getMatiereByName($courseName);

        if ($existing) {
            // Mettre à jour le lien enseignant si la table pivot existe
            if ($teacherId !== null && $this->hasMatiereTeachersPivot()) {
                $full       = $this->courseModel->getMatiereById((int)$existing['id_matiere']);
                $teacherIds = is_array($full['id_professeurs'] ?? null) ? $full['id_professeurs'] : [];
                if (!in_array($teacherId, array_map('intval', $teacherIds), true)) {
                    $teacherIds[] = $teacherId;
                    $this->courseModel->updateMatiere(
                        (int)$existing['id_matiere'],
                        ['id_professeurs' => array_values(array_unique(array_map('intval', $teacherIds)))]
                    );
                    return 'updated';
                }
            }
            return 'unchanged';
        }

        // Créer la matière
        $payload = [
            'matiere'     => $courseName,
                'description' => $description,
                'active'      => $active ? 1 : 0,
        ];
        if ($teacherId !== null && $this->hasMatiereTeachersPivot()) {
            $payload['id_professeurs'] = [$teacherId];
        }
        $this->courseModel->addMatiere($payload);

        return 'inserted';
    }

    private function resolveTeacherIdByUsername(string $username): ?int {
        if ($username === '') {
            return null;
        }

        $pdo  = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT id_professeur FROM professeurs WHERE username = :username LIMIT 1");
        $stmt->execute([':username' => $username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? (int)$row['id_professeur'] : null;
    }

    private function hasMatiereTeachersPivot(): bool {
        if ($this->hasMatiereTeachersTable !== null) {
            return $this->hasMatiereTeachersTable;
        }

        $pdo  = $this->db->getPdo();
        $stmt = $pdo->query("SHOW TABLES LIKE 'matieres_professeurs'");
        $this->hasMatiereTeachersTable = (bool)$stmt->fetch(PDO::FETCH_NUM);

        return $this->hasMatiereTeachersTable;
    }

    private function normalizeBirthDate($value): ?string {
        if (!is_string($value)) {
            return null;
        }
        $value = trim($value);
        if ($value === '' || $value === '0000-00-00') {
            return null;
        }
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : null;
    }

    private function normalizeSearchToken(string $value): string {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if (!is_string($ascii) || $ascii === '') {
            $ascii = $value;
        }

        $ascii = strtolower($ascii);
        $ascii = preg_replace('/[^a-z0-9]+/', '', $ascii) ?? '';
        return $ascii;
    }

    private function parseBooleanLike($value): ?int {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_int($value) || is_float($value)) {
            return ((int)$value) === 0 ? 0 : 1;
        }

        if (!is_string($value)) {
            return null;
        }

        $token = $this->normalizeSearchToken($value);
        if ($token === '') {
            return null;
        }

        $truthy = [
            '1', 'true', 'yes', 'oui', 'o', 'y', 'ja', 'allowed', 'ok',
            'autorise', 'autorisee', 'autorisation', 'actif', 'active'
        ];
        $falsy = [
            '0', 'false', 'no', 'non', 'n', 'nee', 'denied', 'interdit', 'inactive',
            'refuse', 'refusee'
        ];

        if (in_array($token, $truthy, true)) {
            return 1;
        }
        if (in_array($token, $falsy, true)) {
            return 0;
        }

        return null;
    }

    private function looksLikeAutorisationSortieLabel(string $label): bool {
        $token = $this->normalizeSearchToken($label);
        if ($token === '') {
            return false;
        }

        $candidates = [
            'autorisationdesortie',
            'autorisationdesorties',
            'autorisationsortie',
            'autorisationsorties',
            'autorisationmidi',
            'sortieautorisee',
            'sortieautorisee',
        ];

        foreach ($candidates as $candidate) {
            if (str_contains($token, $candidate)) {
                return true;
            }
        }

        return false;
    }

    private function findAutorisationValueRecursive($node): ?int {
        if (!is_array($node)) {
            return null;
        }

        foreach ($node as $key => $value) {
            if (is_string($key) && $this->looksLikeAutorisationSortieLabel($key)) {
                $parsed = $this->parseBooleanLike($value);
                if ($parsed !== null) {
                    return $parsed;
                }
            }

            if (is_array($value)) {
                $label = '';
                foreach (['label', 'name', 'key', 'title', 'omschrijving', 'description'] as $labelKey) {
                    if (isset($value[$labelKey]) && is_string($value[$labelKey])) {
                        $label = (string)$value[$labelKey];
                        break;
                    }
                }

                if ($label !== '' && $this->looksLikeAutorisationSortieLabel($label)) {
                    foreach (['value', 'waarde', 'text', 'val', 'inhoud', 'content'] as $valueKey) {
                        if (array_key_exists($valueKey, $value)) {
                            $parsed = $this->parseBooleanLike($value[$valueKey]);
                            if ($parsed !== null) {
                                return $parsed;
                            }
                        }
                    }
                }

                $nested = $this->findAutorisationValueRecursive($value);
                if ($nested !== null) {
                    return $nested;
                }
            }
        }

        return null;
    }

    private function resolveAutorisationMidiFromUser(array $user): int {
        // 1) Recherche directe sur les clés usuelles
        foreach (['autorisation_midi', 'autorisationSortie', 'autorisation_de_sortie'] as $key) {
            if (array_key_exists($key, $user)) {
                $parsed = $this->parseBooleanLike($user[$key]);
                if ($parsed !== null) {
                    return $parsed;
                }
            }
        }

        // 2) Recherche récursive dans tout le payload (incluant "autres informations")
        $parsedRecursive = $this->findAutorisationValueRecursive($user);
        if ($parsedRecursive !== null) {
            return $parsedRecursive;
        }

        return 0;
    }

    private function logStudentSchemaSample(array $user): void {
        try {
            $keys = array_keys($user);
            $infoCandidates = [];
            foreach ($keys as $k) {
                $token = $this->normalizeSearchToken((string)$k);
                if (str_contains($token, 'info') || str_contains($token, 'information') || str_contains($token, 'other')) {
                    $infoCandidates[] = (string)$k;
                }
            }

            error_log('[SmartschoolSync] student payload keys sample: ' . implode(', ', array_slice($keys, 0, 40)));
            if (!empty($infoCandidates)) {
                error_log('[SmartschoolSync] student info-like keys sample: ' . implode(', ', $infoCandidates));
            }
        } catch (\Throwable $e) {
            // Ne jamais interrompre la synchronisation pour un log de diagnostic
        }
    }
}

<?php
namespace App\Service;

use App\Model\StudentsModel;

class OneRosterSync {
    private OneRosterClient $client;
    private StudentsModel $studentsModel;

    public function __construct() {
        $this->client = new OneRosterClient();
        $this->studentsModel = new StudentsModel();
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

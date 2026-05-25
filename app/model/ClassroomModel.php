<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class ClassroomModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    /**
     * Recupere tous les locaux.
     */
    public function getAllClassrooms(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query("SELECT * FROM locaux ORDER BY local");
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('getAllClassrooms: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Recupere un local par son ID.
     */
    public function getClassroomById(int $id): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM locaux WHERE id_local = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getClassroomById: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Recupere un local par son nom.
     */
    public function getClassroomByName(string $name): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM locaux WHERE local = :local");
            $stmt->execute([':local' => $name]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getClassroomByName: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Ajoute un nouveau local.
     */
    public function addClassroom(array $data): bool {
        $pdo = $this->db->getPdo();
        $local = trim($data['local'] ?? '');

        if ($local === '') {
            error_log('addClassroom: Nom de local requis');
            return false;
        }

        try {
            $existing = $this->getClassroomByName($local);
            if ($existing) {
                error_log('addClassroom: Local "' . $local . '" existe deja');
                return false;
            }

            $stmt = $pdo->prepare("INSERT INTO locaux (local) VALUES (:local)");
            $stmt->execute([':local' => $local]);
            if ($stmt->rowCount() > 0) {
                \App\Service\AuditService::logDbChange('insert', 'locaux', null, ['local' => $local]);
            }
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('addClassroom: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Met a jour un local.
     */
    public function updateClassroom(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $local = trim($data['local'] ?? '');

        if ($local === '') {
            error_log('updateClassroom: Nom de local requis');
            return false;
        }

        try {
            $old = $this->getClassroomById($id);
            if (!$old) {
                return false;
            }

            $existing = $this->getClassroomByName($local);
            if ($existing && (int)$existing['id_local'] !== $id) {
                error_log('updateClassroom: Local "' . $local . '" existe deja');
                return false;
            }

            $stmt = $pdo->prepare("UPDATE locaux SET local = :local WHERE id_local = :id");
            $stmt->execute([
                ':local' => $local,
                ':id' => $id,
            ]);
            if ($stmt->rowCount() > 0) {
                $new = $this->getClassroomById($id);
                \App\Service\AuditService::logDbChange('update', 'locaux', $old, $new);
            }
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('updateClassroom: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprime un local. Refuse si deja utilise dans les horaires.
     */
    public function deleteClassroom(int $id): bool {
        $pdo = $this->db->getPdo();

        try {
            $classroom = $this->getClassroomById($id);
            if (!$classroom) {
                return false;
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) AS count FROM horaires_cours WHERE id_local = :id_local");
            $stmt->execute([':id_local' => $classroom['id_local']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ((int)($result['count'] ?? 0) > 0) {
                error_log('deleteClassroom: Local utilise par ' . $result['count'] . ' horaire(s)');
                return false;
            }

            $stmt = $pdo->prepare("DELETE FROM locaux WHERE id_local = :id");
            $stmt->execute([':id' => $id]);
            if ($stmt->rowCount() > 0) {
                \App\Service\AuditService::logDbChange('delete', 'locaux', $classroom, null);
            }
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('deleteClassroom: ' . $e->getMessage());
            return false;
        }
    }
}

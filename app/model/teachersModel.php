<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class TeachersModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getAllTeachers(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query("SELECT * FROM professeurs ORDER BY nom, prenom");
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('TeachersModel::getAllTeachers: ' . $e->getMessage());
            return [];
        }
    }

    public function getTeacherBySourcedId(string $sourcedId): array|false {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM professeurs WHERE sourcedId = :sourcedId");
        $stmt->execute([':sourcedId' => $sourcedId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createTeacher(array $data): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "INSERT INTO professeurs (sourcedId, internnummer, stamboeknummer, referenceIdentifier,
                                      nom, prenom, email, username, enabled_user)
             VALUES (:sourcedId, :internnummer, :stamboeknummer, :referenceIdentifier,
                     :nom, :prenom, :email, :username, :enabled_user)"
        );

        try {
            $stmt->execute([
                ':sourcedId' => $data['sourcedId'] ?? '',
                ':internnummer'       => $data['internnummer']       ?? null,
                ':stamboeknummer'     => $data['stamboeknummer']     ?? null,
                ':referenceIdentifier'=> $data['referenceIdentifier']?? null,
                ':nom' => $data['nom'] ?? null,
                ':prenom' => $data['prenom'] ?? null,
                ':email' => $data['email'] ?? null,
                ':username' => $data['username'] ?? null,
                ':enabled_user' => !empty($data['enabled_user']) ? 1 : 0,
            ]);
            return true;
        } catch (Exception $e) {
            error_log('TeachersModel::createTeacher: ' . $e->getMessage());
            return false;
        }
    }

    public function updateTeacherBySourcedId(string $sourcedId, array $data): bool {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':sourcedId' => $sourcedId];

        foreach (['nom', 'prenom', 'email', 'username',
                  'internnummer', 'stamboeknummer', 'referenceIdentifier'] as $field) {
            if (array_key_exists($field, $data)) {
                $setClauses[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (array_key_exists('enabled_user', $data)) {
            $setClauses[] = "enabled_user = :enabled_user";
            $params[':enabled_user'] = !empty($data['enabled_user']) ? 1 : 0;
        }

        if (empty($setClauses)) {
            return false;
        }

        $stmt = $pdo->prepare(
            "UPDATE professeurs SET " . implode(', ', $setClauses) . " WHERE sourcedId = :sourcedId"
        );
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }
}

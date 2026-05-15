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

    public function getTeacherById(int $id): array|false {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM professeurs WHERE id_professeur = :id_professeur");
        $stmt->execute([':id_professeur' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
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

    public function addTeacher(array $data): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "INSERT INTO professeurs (sourcedId, nom, prenom, email, username, enabled_user)
             VALUES (:sourcedId, :nom, :prenom, :email, :username, :enabled_user)"
        );

        try {
            $stmt->execute([
                ':sourcedId' => $data['sourcedId'] ?? uniqid('manual_teacher_', true),
                ':nom' => $data['nom'] ?? null,
                ':prenom' => $data['prenom'] ?? null,
                ':email' => $data['email'] ?? null,
                ':username' => $data['username'] ?? null,
                ':enabled_user' => !empty($data['enabled_user']) ? 1 : 1,
            ]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('TeachersModel::addTeacher: ' . $e->getMessage());
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

    public function updateTeacher(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id_professeur' => $id];

        foreach (['nom', 'prenom', 'email', 'username'] as $field) {
            if (array_key_exists($field, $data)) {
                $setClauses[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($setClauses)) {
            return false;
        }

        $stmt = $pdo->prepare(
            "UPDATE professeurs SET " . implode(', ', $setClauses) . " WHERE id_professeur = :id_professeur"
        );
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function deleteTeacher(int $id): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM professeurs WHERE id_professeur = :id_professeur");

        try {
            $stmt->execute([':id_professeur' => $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('TeachersModel::deleteTeacher: ' . $e->getMessage());
            return false;
        }
    }
}

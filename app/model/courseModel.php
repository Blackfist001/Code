<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class CourseModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getAllMatieres(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query("SELECT * FROM matieres ORDER BY matiere");
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('getAllMatieres: ' . $e->getMessage());
            return [];
        }
    }

    public function getMatiereById(int $id): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM matieres WHERE id_matiere = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getMatiereById: ' . $e->getMessage());
            return null;
        }
    }

    public function getMatiereByName(string $name): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM matieres WHERE matiere = :matiere");
            $stmt->execute([':matiere' => $name]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getMatiereByName: ' . $e->getMessage());
            return null;
        }
    }

    public function addMatiere(array $data): bool {
        $pdo = $this->db->getPdo();
        $matiere = trim($data['matiere'] ?? '');

        if ($matiere === '') {
            return false;
        }

        try {
            if ($this->getMatiereByName($matiere)) {
                return false;
            }

            $stmt = $pdo->prepare("INSERT INTO matieres (matiere) VALUES (:matiere)");
            $stmt->execute([':matiere' => $matiere]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('addMatiere: ' . $e->getMessage());
            return false;
        }
    }

    public function updateMatiere(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $matiere = trim($data['matiere'] ?? '');

        if ($matiere === '') {
            return false;
        }

        try {
            $existing = $this->getMatiereByName($matiere);
            if ($existing && (int)$existing['id_matiere'] !== $id) {
                return false;
            }

            $stmt = $pdo->prepare("UPDATE matieres SET matiere = :matiere WHERE id_matiere = :id");
            $stmt->execute([
                ':matiere' => $matiere,
                ':id' => $id,
            ]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('updateMatiere: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteMatiere(int $id): bool {
        $pdo = $this->db->getPdo();

        try {
            $check = $pdo->prepare("SELECT COUNT(*) AS count FROM horaires_cours WHERE id_matiere = :id_matiere");
            $check->execute([':id_matiere' => $id]);
            $used = $check->fetch(PDO::FETCH_ASSOC);
            if (($used['count'] ?? 0) > 0) {
                return false;
            }

            $stmt = $pdo->prepare("DELETE FROM matieres WHERE id_matiere = :id");
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('deleteMatiere: ' . $e->getMessage());
            return false;
        }
    }

    public function searchMatieres(array $filters): array {
        $pdo = $this->db->getPdo();
        $conditions = [];
        $params = [];

        if (!empty($filters['id'])) {
            $conditions[] = "id_matiere = :id";
            $params[':id'] = $filters['id'];
        }

        if (!empty($filters['matiere'])) {
            $conditions[] = "matiere LIKE :matiere";
            $params[':matiere'] = '%' . $filters['matiere'] . '%';
        }

        $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

        try {
            $stmt = $pdo->prepare("SELECT * FROM matieres $whereClause ORDER BY matiere");
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('searchMatieres: ' . $e->getMessage());
            return [];
        }
    }
}

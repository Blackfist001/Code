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

    /**
     * Retourne toutes les matières triées alphabétiquement.
     *
     * @return array
     */
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

    /**
     * Retourne une matière par son ID.
     *
     * @param int $id
     * @return array|null null si non trouvée
     */
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

    /**
     * Recherche une matière par son nom exact.
     *
     * @param string $name
     * @return array|null null si non trouvée
     */
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

    /**
     * Insère une nouvelle matière.
     *
     * @param array $data Champs attendus : matiere (nom)
     * @return bool true si la ligne a été insérée
     * @throws \RuntimeException('DUPLICATE') si le nom est déjà utilisé
     */
    public function addMatiere(array $data): bool {
        $pdo = $this->db->getPdo();
        $matiere = trim($data['matiere'] ?? '');

        if ($matiere === '') {
            return false;
        }

        try {
            if ($this->getMatiereByName($matiere)) {
                throw new \RuntimeException('DUPLICATE');
            }

            $stmt = $pdo->prepare("INSERT INTO matieres (matiere) VALUES (:matiere)");
            $stmt->execute([':matiere' => $matiere]);
            return $stmt->rowCount() > 0;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            error_log('addMatiere: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Met à jour le nom d'une matière.
     *
     * @param int   $id
     * @param array $data Champs attendus : matiere (nouveau nom)
     * @return bool true si la ligne a été modifiée
     * @throws \RuntimeException('DUPLICATE') si le nouveau nom est déjà utilisé par une autre matière
     */
    public function updateMatiere(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $matiere = trim($data['matiere'] ?? '');

        if ($matiere === '') {
            return false;
        }

        try {
            $existing = $this->getMatiereByName($matiere);
            if ($existing && (int)$existing['id_matiere'] !== $id) {
                throw new \RuntimeException('DUPLICATE');
            }

            $stmt = $pdo->prepare("UPDATE matieres SET matiere = :matiere WHERE id_matiere = :id");
            $stmt->execute([
                ':matiere' => $matiere,
                ':id' => $id,
            ]);
            return $stmt->rowCount() > 0;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            error_log('updateMatiere: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprime une matière par son ID.
     *
     * @param int $id
     * @return bool true si la ligne a été supprimée
     * @throws \RuntimeException('USED_IN_SCHEDULES') si la matière est référencée dans des horaires
     */
    public function deleteMatiere(int $id): bool {
        $pdo = $this->db->getPdo();

        try {
            $check = $pdo->prepare("SELECT COUNT(*) AS count FROM horaires_cours WHERE id_matiere = :id_matiere");
            $check->execute([':id_matiere' => $id]);
            $used = $check->fetch(PDO::FETCH_ASSOC);
            if (($used['count'] ?? 0) > 0) {
                throw new \RuntimeException('USED_IN_SCHEDULES');
            }

            $stmt = $pdo->prepare("DELETE FROM matieres WHERE id_matiere = :id");
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            error_log('deleteMatiere: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Recherche des matières selon des filtres optionnels (id, matiere en LIKE).
     *
     * @param array $filters Clés : id, matiere
     * @return array
     */
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

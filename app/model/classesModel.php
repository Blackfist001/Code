<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class ClassesModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    /**
     * Récupère toutes les classes
     */
    public function getAllClasses(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query("SELECT * FROM classes ORDER BY classe");
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('getAllClasses: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Récupère une classe par son ID
     */
    public function getClassById($id): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM classes WHERE id_classe = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getClassById: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Récupère une classe par son nom
     */
    public function getClassByName(string $name): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM classes WHERE classe = :classe");
            $stmt->execute([':classe' => $name]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getClassByName: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Ajoute une nouvelle classe
     */
    public function addClass(array $data): bool {
        $pdo = $this->db->getPdo();
        $classe = $data['classe'] ?? '';

        if (empty($classe)) {
            error_log('addClass: Nom de classe requis');
            return false;
        }

        try {
            // Vérifier si la classe existe déjà
            $existing = $this->getClassByName($classe);
            if ($existing) {
                error_log('addClass: Classe "' . $classe . '" existe déjà');
                return false;
            }

            $stmt = $pdo->prepare("INSERT INTO classes (classe) VALUES (:classe)");
            $stmt->execute([':classe' => $classe]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('addClass: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Met à jour une classe
     */
    public function updateClass(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $classe = $data['classe'] ?? '';

        if (empty($classe)) {
            error_log('updateClass: Nom de classe requis');
            return false;
        }

        try {
            // Vérifier si une autre classe porte ce nom
            $existing = $this->getClassByName($classe);
            if ($existing && $existing['id_classe'] != $id) {
                error_log('updateClass: Classe "' . $classe . '" existe déjà');
                return false;
            }

            $stmt = $pdo->prepare("UPDATE classes SET classe = :classe WHERE id_classe = :id");
            $stmt->execute([
                ':classe' => $classe,
                ':id' => $id
            ]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('updateClass: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprime une classe
     * Vérifie d'abord que la classe n'est pas utilisée
     */
    public function deleteClass(int $id): bool {
        $pdo = $this->db->getPdo();

        try {
            $class = $this->getClassById($id);
            if (!$class) {
                return false;
            }

            // Vérifier que la classe n'est utilisée nulle part
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM etudiants WHERE classe = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result['count'] > 0) {
                error_log('deleteClass: Classe utilisée par ' . $result['count'] . ' étudiant(s)');
                return false;
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM horaires_cours WHERE id_classe = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result['count'] > 0) {
                error_log('deleteClass: Classe utilisée par ' . $result['count'] . ' horaire(s)');
                return false;
            }

            // Supprimer la classe
            $stmt = $pdo->prepare("DELETE FROM classes WHERE id_classe = :id");
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('deleteClass: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Recherche des classes par filtre
     */
    public function searchClasses(array $filters): array {
        $pdo = $this->db->getPdo();
        $conditions = [];
        $params = [];

        if (!empty($filters['id'])) {
            $conditions[] = "id_classe = :id";
            $params[':id'] = $filters['id'];
        }

        if (!empty($filters['classe'])) {
            $conditions[] = "classe LIKE :classe";
            $params[':classe'] = '%' . $filters['classe'] . '%';
        }

        $whereClause = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

        try {
            $stmt = $pdo->prepare("SELECT * FROM classes $whereClause ORDER BY classe");
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('searchClasses: ' . $e->getMessage());
            return [];
        }
    }
}

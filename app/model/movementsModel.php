<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use PDOException;

class MovementsModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function addMovement($movementData) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut, `scan`, `manual`)
             VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut, :scan, :manual)"
        );
        try {
            $stmt->execute([
                ':id_etudiant'  => $movementData['id_etudiant'],
                ':type_passage' => $movementData['type_passage'],
                ':statut'       => $movementData['statut'] ?? 'autorise',
                ':date_passage' => $movementData['date_passage'] ?? date('Y-m-d'),
                ':heure_passage'=> $movementData['heure_passage'] ?? date('H:i:s'),
                ':scan'         => isset($movementData['scan'])   ? (int)(bool)$movementData['scan']   : 0,
                ':manual'       => isset($movementData['manual']) ? (int)(bool)$movementData['manual'] : 0,
            ]);
        } catch (PDOException $e) {
            error_log('Error adding movement: ' . $e->getMessage());
            throw $e;
        }
        return $stmt->rowCount() > 0;
    }

    public function updateMovement($movementId, $movementData) {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id' => $movementId];
        
        if (isset($movementData['id_etudiant'])) {
            $setClauses[] = "id_etudiant = :id_etudiant";
            $params[':id_etudiant'] = $movementData['id_etudiant'];
        }
        if (isset($movementData['type_passage'])) {
            $setClauses[] = "type_passage = :type_passage";
            $params[':type_passage'] = $movementData['type_passage'];
        }
        if (isset($movementData['statut'])) {
            $setClauses[] = "statut = :statut";
            $params[':statut'] = $movementData['statut'];
        }
        
        if (empty($setClauses)) {
            return;
        }
        
        $sql = "UPDATE passages SET " . implode(', ', $setClauses) . " WHERE id_passage = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    public function searchMovements($query) {
        $pdo = $this->db->getPdo();
        // Chercher par nom d'étudiant ou ID
        $stmt = $pdo->prepare("SELECT p.* FROM passages p 
            JOIN etudiants e ON p.id_etudiant = e.id_etudiant 
            WHERE e.nom LIKE :query OR e.prenom LIKE :query OR p.id_etudiant LIKE :query 
            LIMIT 50");
        $stmt->execute([':query' => "%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMovementByStudentId($studentId) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "SELECT * FROM passages
             WHERE id_etudiant = :id_etudiant
               AND type_passage != 'aucun'
             ORDER BY date_passage DESC, heure_passage DESC"
        );
        $stmt->execute([':id_etudiant' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllMovements() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query(
            "SELECT p.*, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
             WHERE p.type_passage != 'aucun'
             ORDER BY p.date_passage DESC, p.heure_passage DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMovementsByDate($date) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "SELECT p.*, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
             WHERE p.date_passage = :date
               AND p.type_passage != 'aucun'
             ORDER BY p.heure_passage DESC"
        );
        $stmt->execute([':date' => $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retourne les types_passage enregistrés aujourd'hui pour un étudiant.
     * Utilisé par le scanner pour détecter sortie_midi vs retour_midi.
     */
    public function getTodayPassageTypes($studentId): array {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "SELECT type_passage FROM passages
             WHERE id_etudiant = :id AND date_passage = CURDATE()
             ORDER BY heure_passage ASC"
        );
        $stmt->execute([':id' => $studentId]);
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'type_passage');
    }

    public function getMovementsBetweenDates($dateFrom, $dateTo) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "SELECT p.*, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
             WHERE p.date_passage BETWEEN :date_from AND :date_to
               AND p.type_passage != 'aucun'
             ORDER BY p.date_passage DESC, p.heure_passage DESC"
        );
        $stmt->execute([':date_from' => $dateFrom, ':date_to' => $dateTo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteMovement($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM passages WHERE id_passage = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Recherche les passages filtrés par infos étudiant (nom, prénom, classe, statut).
     */
    public function searchMovementsByStudent(array $filters): array {
        $pdo = $this->db->getPdo();

        $where = ["p.type_passage != 'aucun'"];
        $params = [];

        if (!empty($filters['nom'])) {
            $where[] = "e.nom = :nom";
            $params[':nom'] = $filters['nom'];
        }
        if (!empty($filters['prenom'])) {
            $where[] = "e.prenom = :prenom";
            $params[':prenom'] = $filters['prenom'];
        }
        if (!empty($filters['classe'])) {
            $where[] = "e.classe = :classe";
            $params[':classe'] = $filters['classe'];
        }
        if (!empty($filters['statut'])) {
            $where[] = "p.statut = :statut";
            $params[':statut'] = $filters['statut'];
        }
        if (!empty($filters['date'])) {
            $where[] = "p.date_passage = :date";
            $params[':date'] = $filters['date'];
        }

        $sql = "SELECT p.id_passage, p.date_passage, p.heure_passage,
                       p.type_passage, p.statut,
                       e.nom, e.prenom, e.classe
                FROM passages p
                JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                WHERE " . implode(' AND ', $where) . "
                ORDER BY p.date_passage DESC, p.heure_passage DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

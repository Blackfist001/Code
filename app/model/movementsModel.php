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
        $stmt = $pdo->prepare("INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut) 
                              VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut)");
        try {
            $stmt->execute([
                ':id_etudiant' => $movementData['id_etudiant'],
                ':type_passage' => $movementData['type_passage'],
                ':statut' => $movementData['statut'] ?? 'autorise',
                ':date_passage' => date('Y-m-d'),
                ':heure_passage' => date('H:i:s')
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
        $stmt = $pdo->prepare("SELECT * FROM passages WHERE id_etudiant = :id_etudiant ORDER BY date_passage DESC, heure_passage DESC");
        $stmt->execute([':id_etudiant' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllMovements() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT * FROM passages ORDER BY date_passage DESC, heure_passage DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMovementsByDate($date) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM passages WHERE date_passage = :date ORDER BY heure_passage DESC");
        $stmt->execute([':date' => $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMovementsBetweenDates($dateFrom, $dateTo) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM passages WHERE date_passage BETWEEN :date_from AND :date_to ORDER BY date_passage DESC, heure_passage DESC");
        $stmt->execute([':date_from' => $dateFrom, ':date_to' => $dateTo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

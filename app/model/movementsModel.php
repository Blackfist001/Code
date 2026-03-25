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
        $stmt = $pdo->prepare("INSERT INTO movements (student_id, movement_type, timestamp) VALUES (:student_id, :movement_type, :timestamp)");
        try {
            $stmt->execute([
                ':student_id' => $movementData['student_id'],
                ':movement_type' => $movementData['movement_type'],
                ':timestamp' => date('Y-m-d H:i:s')
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
        
        if (isset($movementData['student_id'])) {
            $setClauses[] = "student_id = :student_id";
            $params[':student_id'] = $movementData['student_id'];
        }
        if (isset($movementData['movement_type'])) {
            $setClauses[] = "movement_type = :movement_type";
            $params[':movement_type'] = $movementData['movement_type'];
        }
        if (isset($movementData['reason'])) {
            $setClauses[] = "reason = :reason";
            $params[':reason'] = $movementData['reason'];
        }
        
        if (empty($setClauses)) {
            return;
        }
        
        $sql = "UPDATE movements SET " . implode(', ', $setClauses) . ", timestamp = :timestamp WHERE id = :id";
        $params[':timestamp'] = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    public function searchMovements($query) {
        $pdo = $this->db->getPdo();
        // Chercher par nom d'étudiant ou ID
        $stmt = $pdo->prepare("SELECT m.* FROM movements m 
            JOIN students s ON m.student_id = s.id 
            WHERE s.nom LIKE :query OR m.student_id LIKE :query 
            LIMIT 50");
        $stmt->execute([':query' => "%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMovementByStudentId($studentId) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM movements WHERE student_id = :student_id ORDER BY timestamp DESC");
        $stmt->execute([':student_id' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllMovements() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT * FROM movements ORDER BY timestamp DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

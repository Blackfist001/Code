<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;

class StudentsModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getAllStudents() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT * FROM students");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStudentById($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM students WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function searchStudents($query) {
        $pdo = $this->db->getPdo();
        // Chercher par nom ou ID
        $stmt = $pdo->prepare("SELECT * FROM students WHERE nom LIKE :query OR id LIKE :query LIMIT 20");
        $stmt->execute([':query' => "%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

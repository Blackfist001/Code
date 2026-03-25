<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class StudentsModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getAllStudents() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT * FROM etudiants");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStudentById($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM etudiants WHERE id_etudiant = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function searchStudents($query) {
        $pdo = $this->db->getPdo();
        // Chercher par nom ou sourcedId
        $stmt = $pdo->prepare("SELECT * FROM etudiants WHERE nom LIKE :query OR prenom LIKE :query OR sourcedId LIKE :query LIMIT 20");
        $stmt->execute([':query' => "%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addStudent($studentData) {
        $pdo = $this->db->getPdo();
        $nom = $studentData['nom'] ?? '';
        $prenom = $studentData['prenom'] ?? '';
        $classe = $studentData['classe'] ?? '';
        $photo = $studentData['photo'] ?? 'photos/default.jpg';
        $autorisation_midi = $studentData['autorisation_midi'] ?? 0;
        
        if (empty($nom) || empty($prenom)) {
            return false;
        }

        $stmt = $pdo->prepare("
            INSERT INTO etudiants (nom, prenom, classe, photo, autorisation_midi)
            VALUES (:nom, :prenom, :classe, :photo, :autorisation_midi)
        ");
        
        try {
            $stmt->execute([
                ':nom' => $nom,
                ':prenom' => $prenom,
                ':classe' => $classe,
                ':photo' => $photo,
                ':autorisation_midi' => $autorisation_midi
            ]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public function deleteStudent($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM etudiants WHERE id_etudiant = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }
}


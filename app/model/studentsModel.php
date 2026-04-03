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

    public function searchStudents($filters) {
        $pdo = $this->db->getPdo();
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($filters['id'])) {
            $whereConditions[] = "id_etudiant = :id";
            $params[':id'] = $filters['id'];
        }
        
        if (!empty($filters['sourcedId'])) {
            $whereConditions[] = "sourcedId LIKE :sourcedId";
            $params[':sourcedId'] = "%" . $filters['sourcedId'] . "%";
        }
        
        if (!empty($filters['name'])) {
            $whereConditions[] = "nom LIKE :name";
            $params[':name'] = "%" . $filters['name'] . "%";
        }
        
        if (!empty($filters['surname'])) {
            $whereConditions[] = "prenom LIKE :surname";
            $params[':surname'] = "%" . $filters['surname'] . "%";
        }
        
        if (!empty($filters['classe'])) {
            $whereConditions[] = "classe = :classe";
            $params[':classe'] = $filters['classe'];
        }
        
        if (!empty($filters['statut'])) {
            // Pour l'instant, on considère tous les étudiants comme actifs
            // À adapter selon la logique métier
            if ($filters['statut'] === 'actif') {
                $whereConditions[] = "1=1"; // Tous les étudiants sont actifs
            } else {
                $whereConditions[] = "1=0"; // Aucun étudiant inactif pour l'instant
            }
        }
        
        $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";
        
        $stmt = $pdo->prepare("
            SELECT e.*, 
                   COUNT(p.id_passage) as passages_count,
                   'actif' as statut
            FROM etudiants e 
            LEFT JOIN passages p ON e.id_etudiant = p.id_etudiant 
            $whereClause
            GROUP BY e.id_etudiant 
            ORDER BY e.nom, e.prenom 
            LIMIT 50
        ");
        
        $stmt->execute($params);
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


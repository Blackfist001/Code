<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class UsersModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getUserByUsername($username) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE nom = :username");
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAllUsers() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT id_user AS id, nom AS username, role FROM utilisateurs");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addUser($userData) {
        $pdo = $this->db->getPdo();
        $username = $userData['username'] ?? $userData['nom'] ?? '';
        $password = $userData['password'] ?? $userData['mot_de_passe'] ?? '';
        $role = $userData['role'] ?? 'surveillant';

        if (empty($username) || empty($password)) {
            return false;
        }

        $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, mot_de_passe, role) VALUES (:username, :password, :role)");
        try {
            $stmt->execute([
                ':username' => $username,
                ':password' => password_hash($password, PASSWORD_DEFAULT),
                ':role' => $role
            ]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public function deleteUser($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM utilisateurs WHERE id_user = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function updateUser($id, $updateData) {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id' => $id];
        
        // Mapper les noms de champs
        $fieldMap = [
            'username' => 'nom',
            'nom' => 'nom',
            'password' => 'mot_de_passe',
            'mot_de_passe' => 'mot_de_passe',
            'role' => 'role'
        ];

        foreach ($updateData as $key => $value) {
            $dbField = $fieldMap[$key] ?? $key;
            // Hash password if being updated
            if ($dbField === 'mot_de_passe' && !empty($value)) {
                $value = password_hash($value, PASSWORD_DEFAULT);
            }
            $setClauses[] = "$dbField = :$dbField";
            $params[":$dbField"] = $value;
        }
        
        if (empty($setClauses)) {
            return false;
        }
        
        $sql = "UPDATE utilisateurs SET " . implode(', ', $setClauses) . " WHERE id_user = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function getUserById($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT id_user AS id, nom AS username, role FROM utilisateurs WHERE id_user = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function authenticate($username, $password) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE nom = :username");
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log('UsersModel authenticate: username=' . $username . ', user=' . json_encode($user));

        if ($user) {
            $valid = password_verify($password, $user['mot_de_passe']);
            error_log('UsersModel password_verify: ' . ($valid ? 'true' : 'false'));

            if ($valid) {
                return $user;
            }
        }

        return false;
    }
}

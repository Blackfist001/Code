<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;

class UsersModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getUserByUsername($username) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getUsers() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT * FROM users");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createUser($username, $password, $role = 'surveillant') {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, mot_de_passe, role) VALUES (:username, :password, :role)");
        $stmt->execute([
            ':username' => $username,
            ':password' => password_hash($password, PASSWORD_DEFAULT),
            ':role' => $role
        ]);
    }

    public function deleteUser($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM utilisateurs WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }

    public function updateUser($id, $updateData) {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id' => $id];
        
        foreach ($updateData as $key => $value) {
            $setClauses[] = "$key = :$key";
            $params[":$key"] = $value;
        }
        
        if (empty($setClauses)) {
            return;
        }
        
        $sql = "UPDATE utilisateurs SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    public function updateUserPassword($username, $newPassword) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE username = :username");
        $stmt->execute([
            ':password' => password_hash($newPassword, PASSWORD_DEFAULT),
            ':username' => $username
        ]);
    }
}

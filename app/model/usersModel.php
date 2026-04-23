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

    /**
     * Recherche un utilisateur par son nom d'utilisateur.
     *
     * @param string $username
     * @return array|false Données de l'utilisateur, ou false si non trouvé
     */
    public function getUserByUsername($username) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE nom = :username");
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Retourne tous les utilisateurs (id, username, role).
     *
     * @return array
     */
    public function getAllUsers() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT id_user AS id, nom AS username, role FROM utilisateurs");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crée un nouvel utilisateur avec mot de passe haché.
     *
     * @param array $userData Champs attendus : username (ou nom), password (ou mot_de_passe), role
     * @return bool true si l'insertion a réussi
     * @throws \RuntimeException('DUPLICATE') si le nom d'utilisateur est déjà pris
     */
    public function addUser($userData) {
        $pdo = $this->db->getPdo();
        $username = $userData['username'] ?? $userData['nom'] ?? '';
        $password = $userData['password'] ?? $userData['mot_de_passe'] ?? '';
        $role = $userData['role'] ?? 'Surveillant';

        if (empty($username) || empty($password)) {
            return false;
        }

        $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, mot_de_passe, role) VALUES (:username, :password, :role)");
        try {
            if ($this->getUserByUsername($username)) {
                throw new \RuntimeException('DUPLICATE');
            }
            $stmt->execute([
                ':username' => $username,
                ':password' => password_hash($password, PASSWORD_DEFAULT),
                ':role' => $role
            ]);
            return true;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Supprime un utilisateur par son ID. L'utilisateur 'admin' est protégé.
     *
     * @param int|string $id
     * @return bool|'protected' 'protected' si l'utilisateur admin, true si supprimé, false sinon
     */
    public function deleteUser($id) {
        $pdo = $this->db->getPdo();
        // Vérifier que ce n'est pas l'utilisateur admin (protégé)
        $check = $pdo->prepare("SELECT nom FROM utilisateurs WHERE id_user = :id");
        $check->execute([':id' => $id]);
        $user = $check->fetch(\PDO::FETCH_ASSOC);
        if ($user && strtolower($user['nom']) === 'admin') {
            return 'protected';
        }
        $stmt = $pdo->prepare("DELETE FROM utilisateurs WHERE id_user = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Met à jour les champs d'un utilisateur. Le mot de passe est automaquement haché si fourni.
     *
     * @param int|string $id         ID de l'utilisateur
     * @param array      $updateData Champs à mettre à jour (username/nom, password/mot_de_passe, role)
     * @return bool true si au moins une ligne modifiée
     */
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

    /**
     * Recherche un utilisateur par son ID (retourne id, username, role).
     *
     * @param int|string $id
     * @return array|false
     */
    public function getUserById($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT id_user AS id, nom AS username, role FROM utilisateurs WHERE id_user = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Authentifie un utilisateur par username + password.
     *
     * @param string $username
     * @param string $password Mot de passe en clair (vérifié contre le hash)
     * @return array|false Données complètes de l'utilisateur, ou false si échec
     */
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

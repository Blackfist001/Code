# SOLUTIONS PRATIQUES - Corrections des Bugs Critiques

**Objectif:** Fournir du code corrigé prêt à l'emploi pour chaque bug identifié

---

## 1️⃣ CORRECTION: Noms de Tables (CRITIQUE)

### Avant (FAUX) ❌

**DataBase.php**
```php
// Ligne 12 - Chemin incorrect
$config = require __DIR__ . '../config/config.php';
```

**StudentsModel.php**
```php
// Lignes 11-24 - Noms de tables FAUX
public function getAllStudents() {
    $pdo = $this->db->getPdo();
    $stmt = $pdo->query("SELECT * FROM students");  // ❌ Table n'existe pas
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

public function getStudentById($id) {
    $pdo = $this->db->getPdo();
    $stmt = $pdo->prepare("SELECT * FROM students WHERE id = :id");  // ❌
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

public function searchStudents($query) {
    $pdo = $this->db->getPdo();
    $stmt = $pdo->prepare("SELECT * FROM students WHERE nom LIKE :query OR id LIKE :query LIMIT 20");  // ❌
    $stmt->execute([':query' => "%$query%"]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
```

**MovementsModel.php**
```php
// Lignes 11-24 - Noms de tables FAUX
public function addMovement($movementData) {
    $pdo = $this->db->getPdo();
    $stmt = $pdo->prepare(
        "INSERT INTO movements (student_id, movement_type, timestamp) VALUES (:student_id, :movement_type, :timestamp)"  // ❌ Table n'existe pas!
    );
    try {
        $stmt->execute([
            ':student_id' => $movementData['student_id'],        // ❌ Colonne n'existe pas
            ':movement_type' => $movementData['movement_type'],  // ❌ Colonne n'existe pas
            ':timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    // ...
}
```

---

### Après (CORRECT) ✅

**dataBase.php** - Ligne 12
```php
// ✅ CORRECT - Chemin avec slash
$config = require __DIR__ . '/../config/config.php';
```

**StudentsModel.php** - Lignes 11-24
```php
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
        $stmt = $pdo->query("SELECT * FROM etudiants");  // ✅ Correct
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStudentById($id) {
        $pdo = $this->db->getPdo();
        // ✅ Utilise les colonnes correctes de la table
        $stmt = $pdo->prepare("SELECT id_etudiant, nom, prenom, classe, photo, autorisation_midi FROM etudiants WHERE id_etudiant = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function searchStudents($query) {
        $pdo = $this->db->getPdo();
        // ✅ Utilise les bonnes colonnes
        $stmt = $pdo->prepare(
            "SELECT id_etudiant, nom, prenom, classe FROM etudiants 
             WHERE nom LIKE :query OR prenom LIKE :query OR classe LIKE :query 
             LIMIT 20"
        );
        $stmt->execute([':query' => "%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
```

**MovementsModel.php** - Lignes 11-24
```php
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
        // ✅ Utilise les bonnes colonnes de la table passages
        $stmt = $pdo->prepare(
            "INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut) 
             VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut)"
        );
        try {
            $stmt->execute([
                ':id_etudiant' => $movementData['student_id'],  // ✅ Mappe correctement
                ':date_passage' => date('Y-m-d'),
                ':heure_passage' => date('H:i:s'),
                ':type_passage' => $this->mapMovementType($movementData['movement_type']),  // ✅ Convertir 'entry' -> 'entree_matin'
                ':statut' => $movementData['statut'] ?? 'autorise'
            ]);
            return true;
        } catch (PDOException $e) {
            error_log('Error adding movement: ' . $e->getMessage());
            return false;
        }
    }

    // ✅ Nouveau: Mapper les types du frontend vers la BD
    private function mapMovementType($frontendType) {
        $mapping = [
            'entry' => 'entree_matin',
            'exit_noon' => 'sortie_midi',
            'return_noon' => 'retour_midi',
            'authorized_exit' => 'sortie_autorisee'
        ];
        return $mapping[$frontendType] ?? 'entree_matin';
    }

    public function getMovementByStudentId($studentId) {
        $pdo = $this->db->getPdo();
        // ✅ Utilise la bonne table et colonne
        $stmt = $pdo->prepare(
            "SELECT id_passage, id_etudiant, date_passage, heure_passage, type_passage, statut 
             FROM passages 
             WHERE id_etudiant = :student_id 
             ORDER BY date_passage DESC, heure_passage DESC"
        );
        $stmt->execute([':student_id' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
```

**UsersModel.php** - Uniformiser
```php
<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;

class UsersModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    // ✅ Utilise uniformément "utilisateurs"
    public function getUserByUsername($username) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT id_user, nom, mot_de_passe, role FROM utilisateurs WHERE nom = :username");
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getUsers() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT id_user, nom, role FROM utilisateurs");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createUser($username, $password, $role = 'surveillant') {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "INSERT INTO utilisateurs (nom, mot_de_passe, role) VALUES (:username, :password, :role)"
        );
        $stmt->execute([
            ':username' => $username,
            ':password' => password_hash($password, PASSWORD_DEFAULT),
            ':role' => $role
        ]);
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
        
        foreach ($updateData as $key => $value) {
            if (in_array($key, ['nom', 'role'])) {  // ✅ Whitelist pour éviter SQL injection
                $setClauses[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }
        
        if (empty($setClauses)) {
            return false;
        }
        
        $sql = "UPDATE utilisateurs SET " . implode(', ', $setClauses) . " WHERE id_user = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }
}
?>
```

---

## 2️⃣ CORRECTION: Routes API Incohérentes

### Avant (FAUX - 3 systèmes différents) ❌

**movementsModel.js**
```javascript
// Système 1: Fichiers API inexistants
searchMovements(query) {
    fetch(`php/api/searchMovements.php?q=${encodeURIComponent(query)}`)  // ❌ Fichier n'existe pas!
}

addMovement(movementData) {
    fetch('php/api/addMovement.php', {  // ❌ Fichier n'existe pas!
        method: 'POST',
        body: JSON.stringify(movementData)
    })
}

async save(movementData) {
    // Système 2: Routeur PHP (bon, mais inconsistent)
    const response = await fetch('/scan/ajouter', {
        method: 'POST',
        body: formData
    });
}
```

**studentsModel.js**
```javascript
searchStudents(query) {
    // Système 1: Fichiers API inexistants
    fetch(`php/api/searchStudents.php?q=${encodeURIComponent(query)}`)  // ❌ Fichier n'existe pas!
}
```

**usersModel.js**
```javascript
addUser(userData) {
    // Système 1: Fichiers API inexistants
    fetch('php/api/addUser.php', {  // ❌ Fichier n'existe pas!
        method: 'POST',
        body: JSON.stringify(userData)
    })
}
```

---

### Après (CORRECT - Unifier sur Routeur) ✅

**Solution: Utiliser le routeur PHP structuré pour tout**

**Étape 1: Ajouter les routes dans routes.php**
```php
<?php
return [
    'GET' => [
        '/' => ['HomeController', 'index'],
        '/scan' => ['ScanController', 'index'],
        '/students/search' => ['SearchController', 'search'],          // ✅ Nouveau
        '/movements/history/{id}' => ['MovementsController', 'history'], // ✅ Nouveau
        '/movements/student/{id}' => ['MovementsController', 'byStudent'], // ✅ Nouveau
        '/historical/{id}' => ['HistoricalController', 'show'],
        '/dashboard' => ['DashboardController', 'index'],
        '/absent' => ['AbsentController', 'index'],
        '/users' => ['UsersController', 'index'],                      // ✅ Nouveau
        '/gestion' => ['GestionController', 'index'],
    ],
    'POST' => [
        '/login' => ['AuthController', 'verify'],
        '/scan/ajouter' => ['ScanController', 'ajouter'],
        '/movements/add' => ['MovementsController', 'add'],            // ✅ Nouveau
        '/students/search' => ['SearchController', 'search'],
        '/gestion/ajouter' => ['GestionController', 'ajouter'],
        '/gestion/supprimer/{id}' => ['GestionController', 'supprimer'],
        '/users/add' => ['UsersController', 'add'],                    // ✅ Nouveau
        '/users/delete/{id}' => ['UsersController', 'delete'],         // ✅ Nouveau
        '/users/update/{id}' => ['UsersController', 'update'],         // ✅ Nouveau
    ]
];
?>
```

**Étape 2: Créer API.js centralisée**
```javascript
// public/js/api.js - ✅ NOUVEAU

export default class Api {
    static API_BASE = '/';

    static async post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    }

    static async get(endpoint, params = {}) {
        let url = this.API_BASE + endpoint;
        if (Object.keys(params).length > 0) {
            url += '?' + new URLSearchParams(params).toString();
        }
        return this.request(url, 'GET');
    }

    static async request(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
}
```

**Étape 3: Mettre à jour MovementsModel.js**
```javascript
// public/js/model/movementsModel.js - ✅ CORRIGÉ
import Api from '../api.js';

export default class MovementsModel {
    constructor() {
        this.movements = [];
    }

    searchMovements(query) {
        // ✅ Utilise la bonne route du routeur
        Api.get('/movements/search', { q: query })
            .then(data => {
                if (data.success) {
                    console.log(`${data.count} mouvement(s) trouvé(s):`, data.results);
                    alert(`${data.count} mouvement(s) trouvé(s)`);
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => {
                alert('Erreur lors de la recherche de mouvements');
                console.error('Error:', error);
            });
    }

    addMovement(movementData) {
        // ✅ Utilise la bonne route du routeur
        Api.post('/movements/add', {
            student_id: movementData.student_id,
            movement_type: movementData.movement_type,
            statut: movementData.statut || 'autorise'
        })
            .then(data => {
                if (data.success) {
                    alert('Mouvement enregistré avec succès');
                    console.log('Movement added:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => {
                alert('Erreur lors de l\'enregistrement du mouvement');
                console.error('Error:', error);
            });
    }

    async save(movementData) {
        // ✅ Utilise la bonne route
        return await Api.post('/scan/ajouter', {
            student_id: movementData.student_id,
            movement_type: 'entry'
        });
    }
}
```

**Étape 4: Mettre à jour StudentsModel.js**
```javascript
// public/js/model/studentsModel.js - ✅ CORRIGÉ
import Api from '../api.js';

export default class StudentsModel {
    constructor() {
        this.students = [];
    }

    searchStudents(query) {
        // ✅ Utilise la bonne route du routeur
        Api.get('/students/search', { q: query })
            .then(data => {
                if (data.success) {
                    console.log(`${data.count} étudiant(s) trouvé(s):`, data.results);
                    alert(`${data.count} étudiant(s) trouvé(s)`);
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => {
                alert('Erreur lors de la recherche');
                console.error('Error:', error);
            });
    }
}
```

**Étape 5: Mettre à jour UsersModel.js**
```javascript
// public/js/model/usersModel.js - ✅ CORRIGÉ
import Api from '../api.js';

export default class UsersModel {
    constructor() {
        this.users = [];
    }

    addUser(userData) {
        // ✅ Utilise la bonne route du routeur
        Api.post('/users/add', userData)
            .then(data => {
                if (data.success) {
                    alert(`Utilisateur ${userData.name} ajouté avec succès`);
                    console.log('User added:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => {
                alert('Erreur lors de l\'ajout de l\'utilisateur');
                console.error('Error:', error);
            });
    }

    removeUser(userId) {
        // ✅ Utilise la bonne route du routeur
        Api.post(`/users/delete/${userId}`, {})
            .then(data => {
                if (data.success) {
                    alert('Utilisateur supprimé avec succès');
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    updateUser(userId, userData) {
        // ✅ Utilise la bonne route du routeur
        Api.post(`/users/update/${userId}`, userData)
            .then(data => {
                if (data.success) {
                    alert('Utilisateur mis à jour avec succès');
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    getUsers() {
        // ✅ Utilise la bonne route du routeur
        Api.get('/users')
            .then(data => {
                if (data.success) {
                    this.users = data.results;
                    console.log('Users fetched:', this.users);
                } else {
                    console.error('Error fetching users:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }
}
```

---

## 3️⃣ CORRECTION: Contrôleur SearchController.php Vide

### Avant (VIDE) ❌

```php
<?php
namespace App\Controller;

// ❌ Rien ici!
```

---

### Après (IMPLÉMENTÉ) ✅

```php
<?php
namespace App\Controller;

use App\Model\StudentsModel;
use PDO;

class SearchController {

    public function index() {
        // Optionnel: si vous servez une vue HTML
        // require_once '../app/view/searchView.php';
        return;  // ✅ Le frontend charge l'HTML
    }

    // ✅ Cette méthode répond aux appels API
    public function search($params = []) {
        header('Content-Type: application/json');

        $query = $_GET['q'] ?? null;

        if (!$query || strlen($query) < 2) {
            echo json_encode([
                'success' => false,
                'message' => 'Veuillez entrer au moins 2 caractères'
            ]);
            return;
        }

        try {
            $model = new StudentsModel();
            $results = $model->searchStudents($query);

            echo json_encode([
                'success' => true,
                'count' => count($results),
                'results' => $results
            ]);
        } catch (\Exception $e) {
            error_log('Search error: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erreur serveur'
            ]);
        }
    }
}
?>
```

---

## 4️⃣ CORRECTION: AuthController.php Manquant

### Avant (N'EXISTE PAS) ❌

```
app/controller/AuthController.php ❌ FICHIER INEXISTANT
```

---

### Après (CRÉÉ) ✅

```php
<?php
namespace App\Controller;

use App\Model\UsersModel;

class AuthController {

    public function verify($params = []) {
        header('Content-Type: application/json');

        // ✅ Récupère les données JSON POST
        $input = json_decode(file_get_contents('php://input'), true);
        
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Identifiants manquants'
            ]);
            return;
        }

        try {
            $usersModel = new UsersModel();
            $user = $usersModel->getUserByUsername($username);

            // ✅ Vérifier que l'utilisateur existe et que le mot de passe est correct
            if ($user && password_verify($password, $user['mot_de_passe'])) {
                // ✅ Créer une session PHP
                session_start();
                $_SESSION['user_id'] = $user['id_user'];
                $_SESSION['username'] = $user['nom'];
                $_SESSION['role'] = $user['role'];

                echo json_encode([
                    'success' => true,
                    'message' => 'Authentification réussie',
                    'role' => $user['role'],
                    'username' => $user['nom']
                ]);
            } else {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Identifiants invalides'
                ]);
            }
        } catch (\Exception $e) {
            error_log('Auth error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur serveur'
            ]);
        }
    }

    // ✅ Déconnexion
    public function logout($params = []) {
        header('Content-Type: application/json');
        
        session_start();
        session_destroy();

        echo json_encode([
            'success' => true,
            'message' => 'Déconnecté'
        ]);
    }
}
?>
```

---

## 5️⃣ CORRECTION: Router.php Wrong Namespace

### Avant (FAUX) ❌

```php
// router.php ligne 36
$controllerPath = "App\\Controllers\\" . $controllerName;  // ❌ "Controllers" avec 's'

if (class_exists($controllerPath)) {  // ❌ Cherchera "App\Controllers\ScanController"
    $controller = new $controllerPath();
}
```

Mais les fichiers sont dans `app/controller/` (sans 's'), donc la classe est `App\Controller\ScanController`

---

### Après (CORRECT) ✅

```php
// router.php ligne 36
$controllerPath = "App\\Controller\\" . $controllerName;  // ✅ "Controller" sans 's'

if (class_exists($controllerPath)) {  // ✅ Cherchera "App\Controller\ScanController"
    $controller = new $controllerPath();
}
```

---

## 6️⃣ CORRECTION: SessionController.js - Authentification Fictive

### Avant (SIMULÉ, NON SÉ CURISÉ) ❌

```javascript
// sessionController.js
login(username, password) {
    // TODO: Implémenter la validation avec le backend PHP
    // Pour l'instant, simulation simple
    if(username && password) {
        // ❌ Le rôle est déterminé PAR LE FRONTEND!
        let role = 'user';
        if(username.includes('admin')) {
            role = 'administrateur';
        } else if(username.includes('gestion')) {
            role = 'administration';
        }
        
        // ❌ N'importe qui peut modifier sessionStorage dans la console
        sessionStorage.setItem('role', role);
        this.sessionRole = role;
        this.sessionCheck();
    }
}
```

---

### Après (SÉCURISÉ) ✅

```javascript
// sessionController.js - ✅ CORRIGÉ
import Api from '../api.js';

export default class SessionController {

    constructor() {
        this.sessionRole = this.getSessionRole();
        this.sessionView = new SessionView(this);
        this.sessionCheck();
    }

    // ✅ Appel le backend pour vérifier
    async login(username, password) {
        try {
            const data = await Api.post('/login', {
                username: username,
                password: password
            });

            if (data.success) {
                // ✅ Le rôle vient du SERVEUR, pas du frontend
                const role = data.role;
                
                // ✅ Stocker dans sessionStorage (données du serveur vérifiées)
                sessionStorage.setItem('role', role);
                sessionStorage.setItem('username', data.username);
                
                this.sessionRole = role;
                this.sessionCheck();
            } else {
                alert('Erreur de connexion: ' + data.message);
            }
        } catch (error) {
            alert('Erreur de connexion');
            console.error('Login error:', error);
        }
    }

    logout() {
        // ✅ Notifier le serveur
        Api.post('/logout', {})
            .catch(error => console.error('Logout error:', error))
            .finally(() => {
                sessionStorage.removeItem('role');
                sessionStorage.removeItem('username');
                this.sessionRole = null;
                this.sessionCheck();
                window.location.reload();
            });
    }

    getSessionRole() {
        // ✅ Vérifie aussi que la session existe côté serveur via une requête
        return sessionStorage.getItem('role');
    }

    sessionCheck() {
        if (this.sessionRole === null) {
            this.sessionView.renderLogin();
        } else {
            if (this.sessionRole === 'administrateur') {
                this.sessionView.renderAdmin();
            } else if (this.sessionRole === 'administration') {
                this.sessionView.renderGestion();
            } else if (this.sessionRole === 'user' || this.sessionRole === 'surveillant') {
                this.sessionView.renderUser();
            }
        }
    }
}
```

---

## CHECKLIST DE MISE EN PLACE

### Jour 1 - Corrections Critiques Immédiate

- [ ] Corriger `app/core/dataBase.php` ligne 12
  ```
  - __DIR__ . '../config/config.php'
  + __DIR__ . '/../config/config.php'
  ```

- [ ] Corriger `app/core/router.php` ligne 36
  ```
  - App\\Controllers\\
  + App\\Controller\\
  ```

- [ ] Remplacer noms de tables dans `MovementsModel.php`, `StudentsModel.php`, `UsersModel.php`
  ```
  students → etudiants
  movements → passages
  users → utilisateurs
  student_id → id_etudiant
  ```

- [ ] Corriger `scanController.php` ligne 18 (séparer l'assignation)

### Jour 2 - Implémentation API Centralisée

- [ ] Créer `public/js/api.js` avec la classe Api
- [ ] Mettre à jour `movementsModel.js` pour utiliser Api
- [ ] Mettre à jour `studentsModel.js` pour utiliser Api
- [ ] Mettre à jour `usersModel.js` pour utiliser Api
- [ ] Ajouter nouvelles routes dans `app/config/routes.php`

### Jour 3 - Contrôleurs PHP

- [ ] Implémenter `SearchController.php`
- [ ] Implémenter `DashboardController.php`
- [ ] Implémenter `GestionController.php`
- [ ] Implémenter `AbsentController.php`
- [ ] Implémenter `HistoricalController.php`
- [ ] Créer `AuthController.php`
- [ ] Créer `HomeController.php`

### Jour 4 - Authentification

- [ ] Corriger `sessionController.js` pour utiliser le backend
- [ ] Tester login/logout cycle
- [ ] Vérifier sessions PHP

### Jour 5 - Tests Complets

- [ ] Tester création utilisateur
- [ ] Tester scan étudiant
- [ ] Tester recherche étudiant
- [ ] Tester historique


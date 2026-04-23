# SOLUTIONS PRATIQUES - Corrections des Bugs Critiques

**Objectif:** Fournir du code corrigÃ© prÃªt Ã  l'emploi pour chaque bug identifiÃ©

---

## Mise a jour du 20 avril 2026 - Evolutions structurelles recentes

### 1. Refactorisation modulaire de la page Gestion

La logique auparavant concentree dans `managementController.js` et `managementView.js` a ete factorisee en sous-classes par domaine, tout en conservant les deux fichiers d'origine comme facade principale.

#### Controleurs crees

- `public/js/controller/management/managementUsersController.js`
- `public/js/controller/management/managementStudentsController.js`
- `public/js/controller/management/managementPassagesController.js`
- `public/js/controller/management/managementSchedulesController.js`
- `public/js/controller/management/managementClassesController.js`
- `public/js/controller/management/managementMatieresController.js`

#### Vues creees

- `public/js/view/management/managementUsersView.js`
- `public/js/view/management/managementStudentsView.js`
- `public/js/view/management/managementPassagesView.js`
- `public/js/view/management/managementSchedulesView.js`
- `public/js/view/management/managementClassesView.js`
- `public/js/view/management/managementMatieresView.js`

### 2. Factorisation des templates Management

Le template monolithique de gestion a ete remplace par :

- un shell principal : `public/html/management.html`
- des partials par section dans `public/html/management/`

Cette approche simplifie la maintenance sans changer les IDs utilises par le JavaScript.

### 3. Mutualisation CSS de la zone Gestion

Des classes CSS ont ete ajoutees pour remplacer les styles inline repetitifs :

- `mgmt-form-inline`
- `mgmt-filter-inline`
- `mgmt-filter-inline-tight`
- `mgmt-control-auto`
- `mgmt-label-inline`
- `mgmt-toggle-inline`

### 4. Retrait de SmartSchool OAuth

L'integration OAuth SmartSchool a ete abandonnee et les fichiers dedies ont ete supprimes :

- `app/config/smartschool.php`
- `app/service/SmartSchoolSync.php`

Les commentaires de code mentionnant encore cette integration ont ete harmonises pour parler plus largement de `sourcedId externes`.

---

## 1ï¸âƒ£ CORRECTION: Noms de Tables (CRITIQUE)

### Avant (FAUX) âŒ

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
    $stmt = $pdo->query("SELECT * FROM students");  // âŒ Table n'existe pas
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

public function getStudentById($id) {
    $pdo = $this->db->getPdo();
    $stmt = $pdo->prepare("SELECT * FROM students WHERE id = :id");  // âŒ
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

public function searchStudents($query) {
    $pdo = $this->db->getPdo();
    $stmt = $pdo->prepare("SELECT * FROM students WHERE nom LIKE :query OR id LIKE :query LIMIT 20");  // âŒ
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
        "INSERT INTO movements (student_id, movement_type, timestamp) VALUES (:student_id, :movement_type, :timestamp)"  // âŒ Table n'existe pas!
    );
    try {
        $stmt->execute([
            ':student_id' => $movementData['student_id'],        // âŒ Colonne n'existe pas
            ':movement_type' => $movementData['movement_type'],  // âŒ Colonne n'existe pas
            ':timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    // ...
}
```

---

### AprÃ¨s (CORRECT) âœ…

**dataBase.php** - Ligne 12
```php
// âœ… CORRECT - Chemin avec slash
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
        $stmt = $pdo->query("SELECT * FROM etudiants");  // âœ… Correct
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStudentById($id) {
        $pdo = $this->db->getPdo();
        // âœ… Utilise les colonnes correctes de la table
        $stmt = $pdo->prepare("SELECT id_etudiant, nom, prenom, classe, photo, autorisation_midi FROM etudiants WHERE id_etudiant = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function searchStudents($query) {
        $pdo = $this->db->getPdo();
        // âœ… Utilise les bonnes colonnes
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
        // âœ… Utilise les bonnes colonnes de la table passages
        $stmt = $pdo->prepare(
            "INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut) 
             VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut)"
        );
        try {
            $stmt->execute([
                ':id_etudiant' => $movementData['student_id'],  // âœ… Mappe correctement
                ':date_passage' => date('Y-m-d'),
                ':heure_passage' => date('H:i:s'),
                ':type_passage' => $this->mapMovementType($movementData['movement_type']),  // âœ… Convertir 'entry' -> 'entree_matin'
                ':statut' => $movementData['statut'] ?? 'autorise'
            ]);
            return true;
        } catch (PDOException $e) {
            error_log('Error adding movement: ' . $e->getMessage());
            return false;
        }
    }

    // âœ… Nouveau: Mapper les types du frontend vers la BD
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
        // âœ… Utilise la bonne table et colonne
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

    // âœ… Utilise uniformÃ©ment "utilisateurs"
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

    public function createUser($username, $password, $role = 'Surveillant') {
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
            if (in_array($key, ['nom', 'role'])) {  // âœ… Whitelist pour Ã©viter SQL injection
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

## 2ï¸âƒ£ CORRECTION: Routes API IncohÃ©rentes

### Avant (FAUX - 3 systÃ¨mes diffÃ©rents) âŒ

**movementsModel.js**
```javascript
// SystÃ¨me 1: Fichiers API inexistants
searchMovements(query) {
    fetch(`php/api/searchMovements.php?q=${encodeURIComponent(query)}`)  // âŒ Fichier n'existe pas!
}

addMovement(movementData) {
    fetch('php/api/addMovement.php', {  // âŒ Fichier n'existe pas!
        method: 'POST',
        body: JSON.stringify(movementData)
    })
}

async save(movementData) {
    // SystÃ¨me 2: Routeur PHP (bon, mais inconsistent)
    const response = await fetch('/scan/ajouter', {
        method: 'POST',
        body: formData
    });
}
```

**studentsModel.js**
```javascript
searchStudents(query) {
    // SystÃ¨me 1: Fichiers API inexistants
    fetch(`php/api/searchStudents.php?q=${encodeURIComponent(query)}`)  // âŒ Fichier n'existe pas!
}
```

**usersModel.js**
```javascript
addUser(userData) {
    // SystÃ¨me 1: Fichiers API inexistants
    fetch('php/api/addUser.php', {  // âŒ Fichier n'existe pas!
        method: 'POST',
        body: JSON.stringify(userData)
    })
}
```

---

### AprÃ¨s (CORRECT - Unifier sur Routeur) âœ…

**Solution: Utiliser le routeur PHP structurÃ© pour tout**

**Ã‰tape 1: Ajouter les routes dans routes.php**
```php
<?php
return [
    'GET' => [
        '/' => ['HomeController', 'index'],
        '/scan' => ['ScanController', 'index'],
        '/students/search' => ['SearchController', 'search'],          // âœ… Nouveau
        '/movements/history/{id}' => ['MovementsController', 'history'], // âœ… Nouveau
        '/movements/student/{id}' => ['MovementsController', 'byStudent'], // âœ… Nouveau
        '/historical/{id}' => ['HistoricalController', 'show'],
        '/dashboard' => ['DashboardController', 'index'],
        '/absent' => ['AbsentController', 'index'],
        '/users' => ['UsersController', 'index'],                      // âœ… Nouveau
        '/gestion' => ['ManagementController', 'index'],
    ],
    'POST' => [
        '/login' => ['AuthController', 'verify'],
        '/scan/ajouter' => ['ScanController', 'ajouter'],
        '/movements/add' => ['MovementsController', 'add'],            // âœ… Nouveau
        '/students/search' => ['SearchController', 'search'],
        '/gestion/ajouter' => ['ManagementController', 'ajouter'],
        '/gestion/supprimer/{id}' => ['ManagementController', 'supprimer'],
        '/users/add' => ['UsersController', 'add'],                    // âœ… Nouveau
        '/users/delete/{id}' => ['UsersController', 'delete'],         // âœ… Nouveau
        '/users/update/{id}' => ['UsersController', 'update'],         // âœ… Nouveau
    ]
];
?>
```

**Ã‰tape 2: CrÃ©er API.js centralisÃ©e**
```javascript
// public/js/api.js - âœ… NOUVEAU

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

**Ã‰tape 3: Mettre Ã  jour MovementsModel.js**
```javascript
// public/js/model/movementsModel.js - âœ… CORRIGÃ‰
import Api from '../api.js';

export default class MovementsModel {
    constructor() {
        this.movements = [];
    }

    searchMovements(query) {
        // âœ… Utilise la bonne route du routeur
        Api.get('/movements/search', { q: query })
            .then(data => {
                if (data.success) {
                    console.log(`${data.count} mouvement(s) trouvÃ©(s):`, data.results);
                    alert(`${data.count} mouvement(s) trouvÃ©(s)`);
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
        // âœ… Utilise la bonne route du routeur
        Api.post('/movements/add', {
            student_id: movementData.student_id,
            movement_type: movementData.movement_type,
            statut: movementData.statut || 'autorise'
        })
            .then(data => {
                if (data.success) {
                    alert('Mouvement enregistrÃ© avec succÃ¨s');
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
        // âœ… Utilise la bonne route
        return await Api.post('/scan/ajouter', {
            student_id: movementData.student_id,
            movement_type: 'entry'
        });
    }
}
```

**Ã‰tape 4: Mettre Ã  jour StudentsModel.js**
```javascript
// public/js/model/studentsModel.js - âœ… CORRIGÃ‰
import Api from '../api.js';

export default class StudentsModel {
    constructor() {
        this.students = [];
    }

    searchStudents(query) {
        // âœ… Utilise la bonne route du routeur
        Api.get('/students/search', { q: query })
            .then(data => {
                if (data.success) {
                    console.log(`${data.count} Ã©tudiant(s) trouvÃ©(s):`, data.results);
                    alert(`${data.count} Ã©tudiant(s) trouvÃ©(s)`);
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

**Ã‰tape 5: Mettre Ã  jour UsersModel.js**
```javascript
// public/js/model/usersModel.js - âœ… CORRIGÃ‰
import Api from '../api.js';

export default class UsersModel {
    constructor() {
        this.users = [];
    }

    addUser(userData) {
        // âœ… Utilise la bonne route du routeur
        Api.post('/users/add', userData)
            .then(data => {
                if (data.success) {
                    alert(`Utilisateur ${userData.name} ajoutÃ© avec succÃ¨s`);
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
        // âœ… Utilise la bonne route du routeur
        Api.post(`/users/delete/${userId}`, {})
            .then(data => {
                if (data.success) {
                    alert('Utilisateur supprimÃ© avec succÃ¨s');
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    updateUser(userId, userData) {
        // âœ… Utilise la bonne route du routeur
        Api.post(`/users/update/${userId}`, userData)
            .then(data => {
                if (data.success) {
                    alert('Utilisateur mis Ã  jour avec succÃ¨s');
                } else {
                    alert(`Erreur: ${data.message}`);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    getUsers() {
        // âœ… Utilise la bonne route du routeur
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

## 3ï¸âƒ£ CORRECTION: ContrÃ´leur SearchController.php Vide

### Avant (VIDE) âŒ

```php
<?php
namespace App\Controller;

// âŒ Rien ici!
```

---

### AprÃ¨s (IMPLÃ‰MENTÃ‰) âœ…

```php
<?php
namespace App\Controller;

use App\Model\StudentsModel;
use PDO;

class SearchController {

    public function index() {
        // Optionnel: si vous servez une vue HTML
        // require_once '../app/view/searchView.php';
        return;  // âœ… Le frontend charge l'HTML
    }

    // âœ… Cette mÃ©thode rÃ©pond aux appels API
    public function search($params = []) {
        header('Content-Type: application/json');

        $query = $_GET['q'] ?? null;

        if (!$query || strlen($query) < 2) {
            echo json_encode([
                'success' => false,
                'message' => 'Veuillez entrer au moins 2 caractÃ¨res'
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

## 4ï¸âƒ£ CORRECTION: AuthController.php Manquant

### Avant (N'EXISTE PAS) âŒ

```
app/controller/AuthController.php âŒ FICHIER INEXISTANT
```

---

### AprÃ¨s (CRÃ‰Ã‰) âœ…

```php
<?php
namespace App\Controller;

use App\Model\UsersModel;

class AuthController {

    public function verify($params = []) {
        header('Content-Type: application/json');

        // âœ… RÃ©cupÃ¨re les donnÃ©es JSON POST
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

            // âœ… VÃ©rifier que l'utilisateur existe et que le mot de passe est correct
            if ($user && password_verify($password, $user['mot_de_passe'])) {
                // âœ… CrÃ©er une session PHP
                session_start();
                $_SESSION['user_id'] = $user['id_user'];
                $_SESSION['username'] = $user['nom'];
                $_SESSION['role'] = $user['role'];

                echo json_encode([
                    'success' => true,
                    'message' => 'Authentification rÃ©ussie',
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

    // âœ… DÃ©connexion
    public function logout($params = []) {
        header('Content-Type: application/json');
        
        session_start();
        session_destroy();

        echo json_encode([
            'success' => true,
            'message' => 'DÃ©connectÃ©'
        ]);
    }
}
?>
```

---

## 5ï¸âƒ£ CORRECTION: Router.php Wrong Namespace

### Avant (FAUX) âŒ

```php
// router.php ligne 36
$controllerPath = "App\\Controllers\\" . $controllerName;  // âŒ "Controllers" avec 's'

if (class_exists($controllerPath)) {  // âŒ Cherchera "App\Controllers\ScanController"
    $controller = new $controllerPath();
}
```

Mais les fichiers sont dans `app/controller/` (sans 's'), donc la classe est `App\Controller\ScanController`

---

### AprÃ¨s (CORRECT) âœ…

```php
// router.php ligne 36
$controllerPath = "App\\Controller\\" . $controllerName;  // âœ… "Controller" sans 's'

if (class_exists($controllerPath)) {  // âœ… Cherchera "App\Controller\ScanController"
    $controller = new $controllerPath();
}
```

---

## 6ï¸âƒ£ CORRECTION: SessionController.js - Authentification Fictive

### Avant (SIMULÃ‰, NON SÃ‰ CURISÃ‰) âŒ

```javascript
// sessionController.js
login(username, password) {
    // TODO: ImplÃ©menter la validation avec le backend PHP
    // Pour l'instant, simulation simple
    if(username && password) {
        // âŒ Le rÃ´le est dÃ©terminÃ© PAR LE FRONTEND!
        let role = 'user';
        if(username.includes('admin')) {
            role = 'Administrateur';
        } else if(username.includes('gestion')) {
            role = 'Gestionnaire';
        }
        
        // âŒ N'importe qui peut modifier sessionStorage dans la console
        sessionStorage.setItem('role', role);
        this.sessionRole = role;
        this.sessionCheck();
    }
}
```

---

### AprÃ¨s (SÃ‰CURISÃ‰) âœ…

```javascript
// sessionController.js - âœ… CORRIGÃ‰
import Api from '../api.js';

export default class SessionController {

    constructor() {
        this.sessionRole = this.getSessionRole();
        this.sessionView = new SessionView(this);
        this.sessionCheck();
    }

    // âœ… Appel le backend pour vÃ©rifier
    async login(username, password) {
        try {
            const data = await Api.post('/login', {
                username: username,
                password: password
            });

            if (data.success) {
                // âœ… Le rÃ´le vient du SERVEUR, pas du frontend
                const role = data.role;
                
                // âœ… Stocker dans sessionStorage (donnÃ©es du serveur vÃ©rifiÃ©es)
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
        // âœ… Notifier le serveur
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
        // âœ… VÃ©rifie aussi que la session existe cÃ´tÃ© serveur via une requÃªte
        return sessionStorage.getItem('role');
    }

    sessionCheck() {
        if (this.sessionRole === null) {
            this.sessionView.renderLogin();
        } else {
            if (this.sessionRole === 'Administrateur') {
                this.sessionView.renderAdmin();
            } else if (this.sessionRole === 'Gestionnaire') {
                this.sessionView.renderGestion();
            } else if (this.sessionRole === 'Surveillant') {
                this.sessionView.renderUser();
            }
        }
    }
}
```

---

## CHECKLIST DE MISE EN PLACE

### Jour 1 - Corrections Critiques ImmÃ©diate

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
  students â†’ etudiants
  movements â†’ passages
  users â†’ utilisateurs
  student_id â†’ id_etudiant
  ```

- [ ] Corriger `scanController.php` ligne 18 (sÃ©parer l'assignation)

### Jour 2 - ImplÃ©mentation API CentralisÃ©e

- [ ] CrÃ©er `public/js/api.js` avec la classe Api
- [ ] Mettre Ã  jour `movementsModel.js` pour utiliser Api
- [ ] Mettre Ã  jour `studentsModel.js` pour utiliser Api
- [ ] Mettre Ã  jour `usersModel.js` pour utiliser Api
- [ ] Ajouter nouvelles routes dans `app/config/routes.php`

### Jour 3 - ContrÃ´leurs PHP

- [ ] ImplÃ©menter `SearchController.php`
- [ ] ImplÃ©menter `DashboardController.php`
- [ ] ImplÃ©menter `ManagementController.php`
- [ ] ImplÃ©menter `AbsentController.php`
- [ ] ImplÃ©menter `HistoricalController.php`
- [ ] CrÃ©er `AuthController.php`
- [ ] CrÃ©er `HomeController.php`

### Jour 4 - Authentification

- [ ] Corriger `sessionController.js` pour utiliser le backend
- [ ] Tester login/logout cycle
- [ ] VÃ©rifier sessions PHP

### Jour 5 - Tests Complets

- [ ] Tester crÃ©ation utilisateur
- [ ] Tester scan Ã©tudiant
- [ ] Tester recherche Ã©tudiant
- [ ] Tester historique



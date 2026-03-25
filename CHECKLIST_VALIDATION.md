# CHECKLIST DE VALIDATION - Suivi des Corrections

**Utiliser ce fichier pour cocher chaque correction au fur et à mesure.**

---

## 🔴 PHASE 1: CORRECTIONS CRITIQUES IMMÉDIATE

### P1.1 - Corriger Chemin Configuration

- [ ] **Fichier:** [app/core/dataBase.php](app/core/dataBase.php) ligne 12
- [ ] **Avant:** `$config = require __DIR__ . '../config/config.php';`
- [ ] **Après:** `$config = require __DIR__ . '/../config/config.php';`
- [ ] **Vérifier:** Exécuter une requête test → Connection successful?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P1.2 - Corriger Namespace Router

- [ ] **Fichier:** [app/core/router.php](app/core/router.php) ligne 36
- [ ] **Avant:** `$controllerPath = "App\\Controllers\\" . $controllerName;`
- [ ] **Après:** `$controllerPath = "App\\Controller\\" . $controllerName;`
- [ ] **Vérifier:** `GET /scan` → charge ScanController?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P1.3 - Corriger Syntaxe ScanController

- [ ] **Fichier:** [app/controller/scanController.php](app/controller/scanController.php) ligne 18
- [ ] **Avant:** 
```php
$model->addMovement($movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
]);
```
- [ ] **Après:**
```php
$movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
];
$model->addMovement($movementData);
```
- [ ] **Vérifier:** Code s'exécute sans erreur parsing?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P1.4 - Corriger StudentsModel - Noms Tables

- [ ] **Fichier:** [app/model/studentsModel.php](app/model/studentsModel.php)
- [ ] **Changements:**
  - [ ] Ligne 12: `SELECT * FROM students` → `SELECT * FROM etudiants`
  - [ ] Ligne 17: `SELECT * FROM students WHERE id` → `SELECT * FROM etudiants WHERE id_etudiant`
  - [ ] Ligne 22: `SELECT * FROM students WHERE nom` → `SELECT * FROM etudiants WHERE nom`
  - [ ] Ligne 22: `OR id LIKE` → `OR id_etudiant LIKE` (optionnel)
  - [ ] Ligne 22: `SELECT *` → `SELECT id_etudiant, nom, prenom, classe FROM`
- [ ] **Vérifier:** `getAllStudents()` retourne des résultats?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P1.5 - Corriger MovementsModel - Noms Tables Et Colonnes

- [ ] **Fichier:** [app/model/movementsModel.php](app/model/movementsModel.php)
- [ ] **Changements:**
  - [ ] Ligne 19: `INSERT INTO movements` → `INSERT INTO passages`
  - [ ] Ligne 19: `(student_id, movement_type, timestamp)` → `(id_etudiant, date_passage, heure_passage, type_passage, statut)`
  - [ ] Ligne 23: `:student_id` → `:id_etudiant` (partout)
  - [ ] Ligne 24: `:movement_type` → `:type_passage` (+ ajouter mappage)
  - [ ] Ajouter méthode `mapMovementType()` pour convertir 'entry' → 'entree_matin'
  - [ ] Ligne 30: `UPDATE movements` → `UPDATE passages`
  - [ ] Ligne 35: `movement_type` → `type_passage`
  - [ ] Ligne 48: `SELECT m.* FROM movements m` → `SELECT * FROM passages WHERE id_etudiant`
  - [ ] Ligne 56: `SELECT * FROM movements WHERE student_id` → `SELECT * FROM passages WHERE id_etudiant`
  - [ ] Ligne 60: `SELECT * FROM movements` → `SELECT * FROM passages`
- [ ] **Ajouter Mappage:**
```php
private function mapMovementType($frontendType) {
    $mapping = [
        'entry' => 'entree_matin',
        'exit_noon' => 'sortie_midi',
        'return_noon' => 'retour_midi',
        'authorized_exit' => 'sortie_autorisee'
    ];
    return $mapping[$frontendType] ?? 'entree_matin';
}
```
- [ ] **Vérifier:** `addMovement()` insère en BD sans erreur?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P1.6 - Corriger UsersModel - Uniformiser Utilisateurs

- [ ] **Fichier:** [app/model/usersModel.php](app/model/usersModel.php)
- [ ] **Changements:**
  - [ ] Uniformiser sur `utilisateurs` (pas `users`)
  - [ ] Toutes les requêtes SQL doivent utiliser `utilisateurs`
  - [ ] Utiliser `id_user` au lieu de `id`
  - [ ] Ajouter whitelist pour les mises à jour (ligne éviter SQL injection)
- [ ] **Vérifier:** Pas de références à `users`?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

## 🟠 PHASE 2: ROUTES & API (Jour 2)

### P2.1 - Ajouter Routes Dans routes.php

- [ ] **Fichier:** [app/config/routes.php](app/config/routes.php)
- [ ] **Ajouter routes GET:**
  - [ ] `/students/search` → SearchController::search
  - [ ] `/movements/student/{id}` → MovementsController::byStudent
  - [ ] `/movements/history` → MovementsController::history
  - [ ] `/users` → UsersController::index
- [ ] **Ajouter routes POST:**
  - [ ] `/movements/add` → MovementsController::add
  - [ ] `/movements/update/{id}` → MovementsController::update
  - [ ] `/movements/delete/{id}` → MovementsController::delete
  - [ ] `/users/add` → UsersController::add
  - [ ] `/users/update/{id}` → UsersController::update
  - [ ] `/users/delete/{id}` → UsersController::delete
  - [ ] `/logout` → AuthController::logout
- [ ] **Vérifier:** Routeur charge correctement?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P2.2 - Créer public/js/api.js

- [ ] **Fichier:** [public/js/api.js](public/js/api.js) (actuellement VIDE)
- [ ] **Implémentation:**
  - [ ] Classe `Api` avec méthode statique `post(endpoint, data)`
  - [ ] Méthode `get(endpoint, params)`
  - [ ] Méthode `request(endpoint, method, data)` centralisée
  - [ ] Gestion d'erreur unifiée
  - [ ] Headers `Content-Type: application/json`
- [ ] **Tester:** `Api.post('/scan/ajouter', {student_id: 123})` → Response?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P2.3 - Mettre à Jour movementsModel.js

- [ ] **Fichier:** [public/js/model/movementsModel.js](public/js/model/movementsModel.js)
- [ ] **Raplacer tous les `fetch()`:**
  - [ ] `php/api/searchMovements.php` → `Api.get('/movements/search', {q})`
  - [ ] `php/api/addMovement.php` → `Api.post('/movements/add', data)`
  - [ ] `php/api/updateMovement.php` → `Api.post('/movements/update/{id}', data)`
- [ ] **Ajouter Import:** `import Api from '../api.js';`
- [ ] **Tester:** Console ne montre no error sur appel API?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P2.4 - Mettre à Jour studentsModel.js

- [ ] **Fichier:** [public/js/model/studentsModel.js](public/js/model/studentsModel.js)
- [ ] **Raplacer:**
  - [ ] `php/api/searchStudents.php` → `Api.get('/students/search', {q})`
- [ ] **Ajouter Import:** `import Api from '../api.js';`
- [ ] **Tester:** Recherche fonctionne?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P2.5 - Mettre à Jour usersModel.js

- [ ] **Fichier:** [public/js/model/usersModel.js](public/js/model/usersModel.js)
- [ ] **Raplacer tous les `fetch()`:**
  - [ ] `php/api/addUser.php` → `Api.post('/users/add', data)`
  - [ ] `php/api/deleteUser.php` → `Api.post('/users/delete/{id}', {})`
  - [ ] `php/api/updateUser.php` → `Api.post('/users/update/{id}', data)`
- [ ] **Ajouter Import:** `import Api from '../api.js';`
- [ ] **Ajouter méthode `getUsers()`:** Appeler `Api.get('/users')`
- [ ] **Tester:** Pas d'erreur 404 sur appels API?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

## 🟡 PHASE 3: CONTRÔLEURS PHP (Jour 3-4)

### P3.1 - Implémenter SearchController

- [ ] **Fichier:** [app/controller/searchController.php](app/controller/searchController.php)
- [ ] **Méthode `search($params = [])`:**
  - [ ] Récupère `$_GET['q']`
  - [ ] Valide (minimum 2 caractères)
  - [ ] Appelle StudentsModel::searchStudents()
  - [ ] Retourne JSON `{success, count, results}`
- [ ] **Tester:** 
  - [ ] `GET /students/search?q=test` → JSON response?
  - [ ] `GET /students/search` (sans q) → Error message?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P3.2 - Créer AuthController

- [ ] **Fichier:** `app/controller/AuthController.php` (À CRÉER)
- [ ] **Méthode `verify($params = [])`:**
  - [ ] Récupère JSON POST: `{username, password}`
  - [ ] Appelle UsersModel::getUserByUsername()
  - [ ] Vérifie mot de passe avec `password_verify()`
  - [ ] Crée session PHP `$_SESSION['role']`, `$_SESSION['user_id']`
  - [ ] Retourne JSON `{success, role, username}`
- [ ] **Méthode `logout($params = [])`:**
  - [ ] Destroy session
  - [ ] Retourne `{success: true}`
- [ ] **Tester:**
  - [ ] `POST /login {username: 'admin', password: 'admin'}` → Login OK?
  - [ ] `POST /login {username: 'admiin', password: 'wrong'}` → Erreur?
  - [ ] `POST /logout` → Destroy session?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P3.3 - Créer MovementsController

- [ ] **Fichier:** `app/controller/MovementsController.php` (À CRÉER)
- [ ] **Méthode `add($params = [])`:**
  - [ ] POST data: `{student_id, movement_type, statut}`
  - [ ] Appelle MovementsModel::addMovement()
  - [ ] Retourne `{success, message}`
- [ ] **Méthode `byStudent($params = [])`:**
  - [ ] GET params: `{id}`
  - [ ] Appelle MovementsModel::getMovementByStudentId()
  - [ ] Retourne `{success, results}`
- [ ] **Tester:**
  - [ ] `POST /movements/add` → Insert en BD?
  - [ ] `GET /movements/student/1` → Données student?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P3.4 - Créer UsersController

- [ ] **Fichier:** `app/controller/UsersController.php` (À CRÉER)
- [ ] **Méthode `index($params = [])`:**
  - [ ] Appelle UsersModel::getUsers()
  - [ ] Retourne JSON `{success, results}`
- [ ] **Méthode `add($params = [])`:**
  - [ ] POST data: `{name, password, role}`
  - [ ] Hash du mot de passe
  - [ ] Appelle UsersModel::createUser()
  - [ ] Retourne `{success, message}`
- [ ] **Méthode `delete($params = [])`:**
  - [ ] URL param: `{id}`
  - [ ] Appelle UsersModel::deleteUser()
  - [ ] Retourne `{success, message}`
- [ ] **Méthode `update($params = [])`:**
  - [ ] URL param: `{id}`
  - [ ] POST data: `{nom, role}`
  - [ ] Appelle UsersModel::updateUser()
  - [ ] Retourne `{success, message}`
- [ ] **Tester:**
  - [ ] `GET /users` → Liste utilisateurs?
  - [ ] `POST /users/add` → Crée utilisateur?
  - [ ] `POST /users/delete/1` → Supprime?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P3.5 - Implémenter DashboardController

- [ ] **Fichier:** [app/controller/dashboardController.php](app/controller/dashboardController.php)
- [ ] **Méthode `index($params = [])`:**
  - [ ] Retourne statistiques: `{total_students, total_users, today_scans}`
  - [ ] Ou simplement affiche la page (si SPA)
- [ ] **Tester:** Pas d'erreur 500?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

### P3.6 - Autres Contrôleurs

- [ ] **[GestionController](app/controller/gestionController.php):** `index()`, `ajouter()`, `supprimer()`
- [ ] **[AbsentController](app/controller/absentController.php):** `index()`
- [ ] **[HistoricalController](app/controller/historicalController.php):** `show($params)`
- [ ] **`HomeController.php` (créer):** `index()`
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

## 🔵 PHASE 4: AUTHENTIFICATION SÉCURISÉE (Jour 4)

### P4.1 - Corriger sessionController.js

- [ ] **Fichier:** [public/js/controller/sessionController.js](public/js/controller/sessionController.js)
- [ ] **Changements:**
  - [ ] Ajouter `import Api from '../api.js';`
  - [ ] Méthode `login()` doit appeler `Api.post('/login', {username, password})`
  - [ ] Ne PAS déterminer le rôle en frontend
  - [ ] Récupérer le rôle de la réponse backend
  - [ ] Ajouter méthode `logout()` qui appelle `Api.post('/logout', {})`
- [ ] **Tester:**
  - [ ] Login avec credentials valides → OK?
  - [ ] Login avec credentials invalides → Erreur?
  - [ ] Logout → Destroy session?
  - [ ] Naviguer après logout → Redirect login?
- [ ] **Status:** ✅ COMPLÉTÉ | ⏳ EN COURS | ❌ PAS COMMENCÉ

---

## 🟢 PHASE 5: TESTS COMPLETS (Jour 5)

### T1 - Test Authentification

- [ ] **Cas:** Login avec `admin` / `admin`
  - [ ] Forme submit → Redirect à dashboard?
  - [ ] Role = `administrateur`?
  - [ ] Session créée en backend?
- [ ] **Cas:** Login incorrect
  - [ ] Message d'erreur affichée?
  - [ ] No session en backend?
- [ ] **Cas:** Logout
  - [ ] Session détruite?
  - [ ] Redirect vers login?

---

### T2 - Test Scan Étudiant

- [ ] **Cas:** Scanner étudiant à ID valide
  - [ ] POST `/scan/ajouter` avec `student_id`?
  - [ ] Insert dans table `passages`?
  - [ ] Message succès affiché?
- [ ] **Cas:** Scanner sans ID
  - [ ] Erreur "ID manquant"?

---

### T3 - Test Recherche

- [ ] **Cas:** Rechercher étudiant existant
  - [ ] GET `/students/search?q=dupont`?
  - [ ] Résultats affichés?
- [ ] **Cas:** Rechercher inexistant
  - [ ] Message "Aucun résultat"?

---

### T4 - Test Gestion Utilisateurs

- [ ] **Cas:** Ajouter utilisateur
  - [ ] POST `/users/add` `{name, password, role}`?
  - [ ] Insert en table `utilisateurs`?
  - [ ] Password hashé avec password_hash()?
- [ ] **Cas:** Supprimer utilisateur
  - [ ] POST `/users/delete/{id}`?
  - [ ] Suppression complète?

---

### T5 - Test Historique

- [ ] **Cas:** Voir historique étudiant
  - [ ] GET `/historical/{student_id}`?
  - [ ] Liste des passages affichée?

---

### T6 - Test Dashboard

- [ ] **Cas:** Accès dashboard
  - [ ] GET `/dashboard`?
  - [ ] Statistiques calculées?

---

## ✅ VALIDATION FINALE

### Critères de Succès

- [ ] Pas d'erreur 404 autre que routes inexistantes
- [ ] Toutes les réponses JSON ont le format `{success, message, results}`
- [ ] Les tables BD correspondent aux requêtes SQL
- [ ] Frontend → Backend: mappage complet des paramètres
- [ ] Session/Auth: fonctionne correctement
- [ ] Aucune erreur console JavaScript
- [ ] Aucune erreur PHP logs

### Signoffs Finales

- [ ] Code Review par Senior Dev?
- [ ] Tests UAT par Product Owner?
- [ ] Documentation mise à jour?
- [ ] README project complété?

---

## 📝 NOTES DE PROGRESSION

```
Date: _____________

Tâches complétées aujourd'hui:
- ____________________________________
- ____________________________________
- ____________________________________

Blockers rencontrés:
- ____________________________________
- ____________________________________

Prochaines actions:
- ____________________________________
- ____________________________________

Estimation temps restant: _________ heures
```


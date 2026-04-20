# CHECKLIST DE VALIDATION - Suivi des Corrections

**Utiliser ce fichier pour cocher chaque correction au fur et Ã  mesure.**

## Mise a jour du 20 avril 2026

Le detail historique ci-dessous est conserve. La checklist suivante reflete les validations importantes ajoutees ou finalisees lors des evolutions recentes.

### Etat actuel - Evolutions recentes validees

- [x] La page `gestion` a ete refactorisee en sous-controleurs et sous-vues, avec conservation des points d'entree principaux.
- [x] `public/html/management.html` a ete converti en shell avec chargement dynamique de partials.
- [x] Les partials de gestion ont ete ajoutes pour `users`, `students`, `passages`, `schedules`, `classes`, `matieres`.
- [x] Les styles inline repetitifs de gestion ont ete remplaces par des classes CSS reutilisables.
- [x] Les formulaires horaires utilisent des selects alimentes par la base pour `Classe` et `Matiere`.
- [x] La liste des horaires dispose de filtres `Classe`, `Matiere`, `Jour`.
- [x] Les pages `Classes` et `Matieres` existent avec CRUD et sans colonne d'ID dans la liste.
- [x] La gestion etudiants permet l'ajout d'un etudiant avec selection de classe.
- [x] La gestion etudiants affiche la colonne `Demi-journees abs.`.
- [x] La page `Absents` affiche la colonne `Demi-journees d'absences` avec la meme logique visuelle que la recherche.
- [x] La page `Gestion passages` affiche a nouveau les passages apres correction SQL sur `demi_journee_absence`.
- [x] La page `Gestion passages` integre `Ajouter un passage`, des filtres dates dans la liste et l'export CSV.
- [x] La page `Encodage manuel` pre-remplit automatiquement date et heure.
- [x] Les alertes de l'interface conservent le comportement SweetAlert attendu.
- [x] L'integration OAuth SmartSchool abandonnee a ete retiree du code.

### Fichiers supprimes dans le cadre du nettoyage

- [x] `app/config/smartschool.php`
- [x] `app/service/SmartSchoolSync.php`

### A garder comme historique de reference

- [ ] Les phases 1 a 5 ci-dessous correspondent au plan initial et non a un etat exact completement a jour.
- [ ] Les cases non cochees plus bas ne doivent pas etre interpretees comme un etat reel sans verification du code courant.

---

## ðŸ”´ PHASE 1: CORRECTIONS CRITIQUES IMMÃ‰DIATE

### P1.1 - Corriger Chemin Configuration

- [ ] **Fichier:** [app/core/dataBase.php](app/core/dataBase.php) ligne 12
- [ ] **Avant:** `$config = require __DIR__ . '../config/config.php';`
- [ ] **AprÃ¨s:** `$config = require __DIR__ . '/../config/config.php';`
- [ ] **VÃ©rifier:** ExÃ©cuter une requÃªte test â†’ Connection successful?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P1.2 - Corriger Namespace Router

- [ ] **Fichier:** [app/core/router.php](app/core/router.php) ligne 36
- [ ] **Avant:** `$controllerPath = "App\\Controllers\\" . $controllerName;`
- [ ] **AprÃ¨s:** `$controllerPath = "App\\Controller\\" . $controllerName;`
- [ ] **VÃ©rifier:** `GET /scan` â†’ charge ScanController?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

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
- [ ] **AprÃ¨s:**
```php
$movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
];
$model->addMovement($movementData);
```
- [ ] **VÃ©rifier:** Code s'exÃ©cute sans erreur parsing?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P1.4 - Corriger StudentsModel - Noms Tables

- [ ] **Fichier:** [app/model/studentsModel.php](app/model/studentsModel.php)
- [ ] **Changements:**
  - [ ] Ligne 12: `SELECT * FROM students` â†’ `SELECT * FROM etudiants`
  - [ ] Ligne 17: `SELECT * FROM students WHERE id` â†’ `SELECT * FROM etudiants WHERE id_etudiant`
  - [ ] Ligne 22: `SELECT * FROM students WHERE nom` â†’ `SELECT * FROM etudiants WHERE nom`
  - [ ] Ligne 22: `OR id LIKE` â†’ `OR id_etudiant LIKE` (optionnel)
  - [ ] Ligne 22: `SELECT *` â†’ `SELECT id_etudiant, nom, prenom, classe FROM`
- [ ] **VÃ©rifier:** `getAllStudents()` retourne des rÃ©sultats?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P1.5 - Corriger MovementsModel - Noms Tables Et Colonnes

- [ ] **Fichier:** [app/model/movementsModel.php](app/model/movementsModel.php)
- [ ] **Changements:**
  - [ ] Ligne 19: `INSERT INTO movements` â†’ `INSERT INTO passages`
  - [ ] Ligne 19: `(student_id, movement_type, timestamp)` â†’ `(id_etudiant, date_passage, heure_passage, type_passage, statut)`
  - [ ] Ligne 23: `:student_id` â†’ `:id_etudiant` (partout)
  - [ ] Ligne 24: `:movement_type` â†’ `:type_passage` (+ ajouter mappage)
  - [ ] Ajouter mÃ©thode `mapMovementType()` pour convertir 'entry' â†’ 'entree_matin'
  - [ ] Ligne 30: `UPDATE movements` â†’ `UPDATE passages`
  - [ ] Ligne 35: `movement_type` â†’ `type_passage`
  - [ ] Ligne 48: `SELECT m.* FROM movements m` â†’ `SELECT * FROM passages WHERE id_etudiant`
  - [ ] Ligne 56: `SELECT * FROM movements WHERE student_id` â†’ `SELECT * FROM passages WHERE id_etudiant`
  - [ ] Ligne 60: `SELECT * FROM movements` â†’ `SELECT * FROM passages`
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
- [ ] **VÃ©rifier:** `addMovement()` insÃ¨re en BD sans erreur?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P1.6 - Corriger UsersModel - Uniformiser Utilisateurs

- [ ] **Fichier:** [app/model/usersModel.php](app/model/usersModel.php)
- [ ] **Changements:**
  - [ ] Uniformiser sur `utilisateurs` (pas `users`)
  - [ ] Toutes les requÃªtes SQL doivent utiliser `utilisateurs`
  - [ ] Utiliser `id_user` au lieu de `id`
  - [ ] Ajouter whitelist pour les mises Ã  jour (ligne Ã©viter SQL injection)
- [ ] **VÃ©rifier:** Pas de rÃ©fÃ©rences Ã  `users`?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

## ðŸŸ  PHASE 2: ROUTES & API (Jour 2)

### P2.1 - Ajouter Routes Dans routes.php

- [ ] **Fichier:** [app/config/routes.php](app/config/routes.php)
- [ ] **Ajouter routes GET:**
  - [ ] `/students/search` â†’ SearchController::search
  - [ ] `/movements/student/{id}` â†’ MovementsController::byStudent
  - [ ] `/movements/history` â†’ MovementsController::history
  - [ ] `/users` â†’ UsersController::index
- [ ] **Ajouter routes POST:**
  - [ ] `/movements/add` â†’ MovementsController::add
  - [ ] `/movements/update/{id}` â†’ MovementsController::update
  - [ ] `/movements/delete/{id}` â†’ MovementsController::delete
  - [ ] `/users/add` â†’ UsersController::add
  - [ ] `/users/update/{id}` â†’ UsersController::update
  - [ ] `/users/delete/{id}` â†’ UsersController::delete
  - [ ] `/logout` â†’ AuthController::logout
- [ ] **VÃ©rifier:** Routeur charge correctement?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P2.2 - CrÃ©er public/js/api.js

- [ ] **Fichier:** [public/js/api.js](public/js/api.js) (actuellement VIDE)
- [ ] **ImplÃ©mentation:**
  - [ ] Classe `Api` avec mÃ©thode statique `post(endpoint, data)`
  - [ ] MÃ©thode `get(endpoint, params)`
  - [ ] MÃ©thode `request(endpoint, method, data)` centralisÃ©e
  - [ ] Gestion d'erreur unifiÃ©e
  - [ ] Headers `Content-Type: application/json`
- [ ] **Tester:** `Api.post('/scan/ajouter', {student_id: 123})` â†’ Response?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P2.3 - Mettre Ã  Jour movementsModel.js

- [ ] **Fichier:** [public/js/model/movementsModel.js](public/js/model/movementsModel.js)
- [ ] **Raplacer tous les `fetch()`:**
  - [ ] `php/api/searchMovements.php` â†’ `Api.get('/movements/search', {q})`
  - [ ] `php/api/addMovement.php` â†’ `Api.post('/movements/add', data)`
  - [ ] `php/api/updateMovement.php` â†’ `Api.post('/movements/update/{id}', data)`
- [ ] **Ajouter Import:** `import Api from '../api.js';`
- [ ] **Tester:** Console ne montre no error sur appel API?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P2.4 - Mettre Ã  Jour studentsModel.js

- [ ] **Fichier:** [public/js/model/studentsModel.js](public/js/model/studentsModel.js)
- [ ] **Raplacer:**
  - [ ] `php/api/searchStudents.php` â†’ `Api.get('/students/search', {q})`
- [ ] **Ajouter Import:** `import Api from '../api.js';`
- [ ] **Tester:** Recherche fonctionne?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P2.5 - Mettre Ã  Jour usersModel.js

- [ ] **Fichier:** [public/js/model/usersModel.js](public/js/model/usersModel.js)
- [ ] **Raplacer tous les `fetch()`:**
  - [ ] `php/api/addUser.php` â†’ `Api.post('/users/add', data)`
  - [ ] `php/api/deleteUser.php` â†’ `Api.post('/users/delete/{id}', {})`
  - [ ] `php/api/updateUser.php` â†’ `Api.post('/users/update/{id}', data)`
- [ ] **Ajouter Import:** `import Api from '../api.js';`
- [ ] **Ajouter mÃ©thode `getUsers()`:** Appeler `Api.get('/users')`
- [ ] **Tester:** Pas d'erreur 404 sur appels API?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

## ðŸŸ¡ PHASE 3: CONTRÃ”LEURS PHP (Jour 3-4)

### P3.1 - ImplÃ©menter SearchController

- [ ] **Fichier:** [app/controller/searchController.php](app/controller/searchController.php)
- [ ] **MÃ©thode `search($params = [])`:**
  - [ ] RÃ©cupÃ¨re `$_GET['q']`
  - [ ] Valide (minimum 2 caractÃ¨res)
  - [ ] Appelle StudentsModel::searchStudents()
  - [ ] Retourne JSON `{success, count, results}`
- [ ] **Tester:** 
  - [ ] `GET /students/search?q=test` â†’ JSON response?
  - [ ] `GET /students/search` (sans q) â†’ Error message?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P3.2 - CrÃ©er AuthController

- [ ] **Fichier:** `app/controller/AuthController.php` (Ã€ CRÃ‰ER)
- [ ] **MÃ©thode `verify($params = [])`:**
  - [ ] RÃ©cupÃ¨re JSON POST: `{username, password}`
  - [ ] Appelle UsersModel::getUserByUsername()
  - [ ] VÃ©rifie mot de passe avec `password_verify()`
  - [ ] CrÃ©e session PHP `$_SESSION['role']`, `$_SESSION['user_id']`
  - [ ] Retourne JSON `{success, role, username}`
- [ ] **MÃ©thode `logout($params = [])`:**
  - [ ] Destroy session
  - [ ] Retourne `{success: true}`
- [ ] **Tester:**
  - [ ] `POST /login {username: 'admin', password: 'admin'}` â†’ Login OK?
  - [ ] `POST /login {username: 'admiin', password: 'wrong'}` â†’ Erreur?
  - [ ] `POST /logout` â†’ Destroy session?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P3.3 - CrÃ©er MovementsController

- [ ] **Fichier:** `app/controller/MovementsController.php` (Ã€ CRÃ‰ER)
- [ ] **MÃ©thode `add($params = [])`:**
  - [ ] POST data: `{student_id, movement_type, statut}`
  - [ ] Appelle MovementsModel::addMovement()
  - [ ] Retourne `{success, message}`
- [ ] **MÃ©thode `byStudent($params = [])`:**
  - [ ] GET params: `{id}`
  - [ ] Appelle MovementsModel::getMovementByStudentId()
  - [ ] Retourne `{success, results}`
- [ ] **Tester:**
  - [ ] `POST /movements/add` â†’ Insert en BD?
  - [ ] `GET /movements/student/1` â†’ DonnÃ©es student?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P3.4 - CrÃ©er UsersController

- [ ] **Fichier:** `app/controller/UsersController.php` (Ã€ CRÃ‰ER)
- [ ] **MÃ©thode `index($params = [])`:**
  - [ ] Appelle UsersModel::getUsers()
  - [ ] Retourne JSON `{success, results}`
- [ ] **MÃ©thode `add($params = [])`:**
  - [ ] POST data: `{name, password, role}`
  - [ ] Hash du mot de passe
  - [ ] Appelle UsersModel::createUser()
  - [ ] Retourne `{success, message}`
- [ ] **MÃ©thode `delete($params = [])`:**
  - [ ] URL param: `{id}`
  - [ ] Appelle UsersModel::deleteUser()
  - [ ] Retourne `{success, message}`
- [ ] **MÃ©thode `update($params = [])`:**
  - [ ] URL param: `{id}`
  - [ ] POST data: `{nom, role}`
  - [ ] Appelle UsersModel::updateUser()
  - [ ] Retourne `{success, message}`
- [ ] **Tester:**
  - [ ] `GET /users` â†’ Liste utilisateurs?
  - [ ] `POST /users/add` â†’ CrÃ©e utilisateur?
  - [ ] `POST /users/delete/1` â†’ Supprime?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P3.5 - ImplÃ©menter DashboardController

- [ ] **Fichier:** [app/controller/dashboardController.php](app/controller/dashboardController.php)
- [ ] **MÃ©thode `index($params = [])`:**
  - [ ] Retourne statistiques: `{total_students, total_users, today_scans}`
  - [ ] Ou simplement affiche la page (si SPA)
- [ ] **Tester:** Pas d'erreur 500?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

### P3.6 - Autres ContrÃ´leurs

- [ ] **[ManagementController](app/controller/managementController.php):** `index()`, `ajouter()`, `supprimer()`
- [ ] **[AbsentController](app/controller/absentController.php):** `index()`
- [ ] **[HistoricalController](app/controller/historicalController.php):** `show($params)`
- [ ] **`HomeController.php` (crÃ©er):** `index()`
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

## ðŸ”µ PHASE 4: AUTHENTIFICATION SÃ‰CURISÃ‰E (Jour 4)

### P4.1 - Corriger sessionController.js

- [ ] **Fichier:** [public/js/controller/sessionController.js](public/js/controller/sessionController.js)
- [ ] **Changements:**
  - [ ] Ajouter `import Api from '../api.js';`
  - [ ] MÃ©thode `login()` doit appeler `Api.post('/login', {username, password})`
  - [ ] Ne PAS dÃ©terminer le rÃ´le en frontend
  - [ ] RÃ©cupÃ©rer le rÃ´le de la rÃ©ponse backend
  - [ ] Ajouter mÃ©thode `logout()` qui appelle `Api.post('/logout', {})`
- [ ] **Tester:**
  - [ ] Login avec credentials valides â†’ OK?
  - [ ] Login avec credentials invalides â†’ Erreur?
  - [ ] Logout â†’ Destroy session?
  - [ ] Naviguer aprÃ¨s logout â†’ Redirect login?
- [ ] **Status:** âœ… COMPLÃ‰TÃ‰ | â³ EN COURS | âŒ PAS COMMENCÃ‰

---

## ðŸŸ¢ PHASE 5: TESTS COMPLETS (Jour 5)

### T1 - Test Authentification

- [ ] **Cas:** Login avec `admin` / `admin`
  - [ ] Forme submit â†’ Redirect Ã  dashboard?
  - [ ] Role = `administrateur`?
  - [ ] Session crÃ©Ã©e en backend?
- [ ] **Cas:** Login incorrect
  - [ ] Message d'erreur affichÃ©e?
  - [ ] No session en backend?
- [ ] **Cas:** Logout
  - [ ] Session dÃ©truite?
  - [ ] Redirect vers login?

---

### T2 - Test Scan Ã‰tudiant

- [ ] **Cas:** Scanner Ã©tudiant Ã  ID valide
  - [ ] POST `/scan/ajouter` avec `student_id`?
  - [ ] Insert dans table `passages`?
  - [ ] Message succÃ¨s affichÃ©?
- [ ] **Cas:** Scanner sans ID
  - [ ] Erreur "ID manquant"?

---

### T3 - Test Recherche

- [ ] **Cas:** Rechercher Ã©tudiant existant
  - [ ] GET `/students/search?q=dupont`?
  - [ ] RÃ©sultats affichÃ©s?
- [ ] **Cas:** Rechercher inexistant
  - [ ] Message "Aucun rÃ©sultat"?

---

### T4 - Test Gestion Utilisateurs

- [ ] **Cas:** Ajouter utilisateur
  - [ ] POST `/users/add` `{name, password, role}`?
  - [ ] Insert en table `utilisateurs`?
  - [ ] Password hashÃ© avec password_hash()?
- [ ] **Cas:** Supprimer utilisateur
  - [ ] POST `/users/delete/{id}`?
  - [ ] Suppression complÃ¨te?

---

### T5 - Test Historique

- [ ] **Cas:** Voir historique Ã©tudiant
  - [ ] GET `/historical/{student_id}`?
  - [ ] Liste des passages affichÃ©e?

---

### T6 - Test Dashboard

- [ ] **Cas:** AccÃ¨s dashboard
  - [ ] GET `/dashboard`?
  - [ ] Statistiques calculÃ©es?

---

## âœ… VALIDATION FINALE

### CritÃ¨res de SuccÃ¨s

- [ ] Pas d'erreur 404 autre que routes inexistantes
- [ ] Toutes les rÃ©ponses JSON ont le format `{success, message, results}`
- [ ] Les tables BD correspondent aux requÃªtes SQL
- [ ] Frontend â†’ Backend: mappage complet des paramÃ¨tres
- [ ] Session/Auth: fonctionne correctement
- [ ] Aucune erreur console JavaScript
- [ ] Aucune erreur PHP logs

### Signoffs Finales

- [ ] Code Review par Senior Dev?
- [ ] Tests UAT par Product Owner?
- [ ] Documentation mise Ã  jour?
- [ ] README project complÃ©tÃ©?

---

## ðŸ“ NOTES DE PROGRESSION

```
Date: _____________

TÃ¢ches complÃ©tÃ©es aujourd'hui:
- ____________________________________
- ____________________________________
- ____________________________________

Blockers rencontrÃ©s:
- ____________________________________
- ____________________________________

Prochaines actions:
- ____________________________________
- ____________________________________

Estimation temps restant: _________ heures
```



# RAPPORT D'ANALYSE COMPLÃˆTE - Projet MVC Scan Sorties Ã‰tudiants

**Date:** 25 mars 2026  
**Type:** Audit technique - Frontend JavaScript POO + Backend PHP POO  
**PrioritÃ©:** CRITIQUE - Nombreux blocages empÃªchant le fonctionnement

## Mise a jour du 20 avril 2026

Le contenu ci-dessous reste utile comme historique d'audit initial, mais il ne represente plus entierement l'etat actuel du projet.

### Evolutions majeures depuis l'audit initial

- La zone `gestion` a ete fortement etendue et refactorisee.
- `public/js/controller/managementController.js` et `public/js/view/managementView.js` sont des points d'entree conserves, mais la logique a ete decomposee en sous-controleurs et sous-vues par section.
- `public/html/management.html` est maintenant un shell chargeant des partials dedies par domaine.
- Les styles inline repetitifs de la zone gestion ont ete remplaces par des classes CSS mutualisees.

### Ajouts fonctionnels actés

- Gestion horaires : selects alimentes par la base pour `Classe` et `Matiere`, plus filtres de liste.
- Gestion classes et matieres : pages CRUD ajoutees avec modification et suppression.
- Gestion etudiants : ajout d'un formulaire de creation, filtres simplifies, et colonne `Demi-journees abs.`.
- Gestion passages : correction de l'affichage vide, nouveau bloc `Ajouter un passage`, filtres repositionnes, export CSV ajoute.
- Encodage manuel : date et heure courantes pre-remplies automatiquement.
- Page absents : ajout de la colonne `Demi-journees d'absences` avec mise en evidence visuelle comme en recherche.

### Nettoyage technique acté

- L'ancienne integration OAuth SmartSchool a ete retiree.
- Fichiers supprimes :
    - `app/config/smartschool.php`
    - `app/service/SmartSchoolSync.php`
- L'integration OneRoster reste presente et distincte.

### Points de lecture a interpreter comme historiques

- Les sections listant `managementController.php` ou `managementView.js` comme gros points de concentration restent utiles pour comprendre le contexte initial, mais elles ont ete traitees par factorisation.
- Les anciennes hypotheses sur l'absence de certaines pages ou de certaines interactions de gestion ne sont plus a jour.

---

## ðŸ“‹ TABLE DES MATIÃˆRES
1. [Bugs Critiques](#bugs-critiques)
2. [ProblÃ¨mes de Communication API](#problÃ¨mes-de-communication-api)
3. [ProblÃ¨mes d'Architecture](#problÃ¨mes-darchitecture)
4. [Fichiers Incomplets/Manquants](#fichiersincompletsmanquants)
5. [Fichiers Ã  Revoir Prioritairement](#fichiers-Ã -revoir-prioritairement)
6. [RÃ©sumÃ© des Actions Requises](#rÃ©sumÃ©-des-actions-requises)

---

## ðŸ”´ BUGS CRITIQUES

### 1. **CRITIQUE - IncohÃ©rence des Noms de Tables (Frontend â‰  Database â‰  Backend)**

**Localisation:**
- [app/core/dataBase.php](app/core/dataBase.php) - Config gÃ©nÃ©rale
- [app/model/studentsModel.php](app/model/studentsModel.php) - RequÃªtes
- [app/model/movementsModel.php](app/model/movementsModel.php) - RequÃªtes
- [app/model/usersModel.php](app/model/usersModel.php) - RequÃªtes
- [Creation DB-Tables sortie_ecole.sql](Creation%20DB-Tables%20sortie_ecole.sql) - SchÃ©ma BD

**ProblÃ¨me:**
```
DATABASE SQL              BACKEND PHP MODELS         FRONTEND JAVASCRIPT
============              ======================      ===================
etudiants        -----â†’  SELECT * FROM students  â†--- utilisÃ© dans API
passages         -----â†’  INSERT INTO movements   â†--- appels fetch
utilisateurs     -----â†’  SELECT * FROM users     â†--- envoie student_id
```

**DÃ©tails:**
- **Base de donnÃ©es** crÃ©e `etudiants`, `passages`, `utilisateurs`
- **StudentsModel.php ligne 12** exÃ©cute `SELECT * FROM students` âŒ
- **MovementsModel.php ligne 19** exÃ©cute `INSERT INTO movements` âŒ
- **UsersModel.php** exÃ©cute `SELECT * FROM utilisateurs` mais utilise aussi `users` inconsistently âŒ
- **Frontend JavaScript** envoie `student_id` mais la DB attend `id_etudiant` âŒ
- **Frontend** envoie `movement_type: 'entry'` mais la DB attend type_passage ENUM âŒ

**Impact:** Les requÃªtes Ã©choueront avec erreurs "table not found"

**Ã€ Corriger:**
```php
// AVANT (FAUX):
SELECT * FROM students
INSERT INTO movements

// APRÃˆS (CORRECT):
SELECT * FROM etudiants
INSERT INTO passages
```

---

### 2. **CRITIQUE - Fichier api.js ComplÃ¨tement Vide**

**Localisation:** [public/js/api.js](public/js/api.js)

**ProblÃ¨me:** 
- Le fichier existe mais est vide
- Aucune couche API centralisÃ©e
- Chaque modÃ¨le fait son propre `fetch()` sans cohÃ©rence

**Impact:** 
- Code dupliquÃ© dans tous les modÃ¨les JS
- Pas de gestion centralisÃ©e d'erreurs
- Pas d'intercepteurs API

**Ã€ Faire:**
CrÃ©er une classe API centralisÃ©e pour tous les appels HTTP.

---

### 3. **CRITIQUE - Appels API IncohÃ©rents (Chemins DiffÃ©rents)**

**Localisation:**
- [public/js/model/movementsModel.js](public/js/model/movementsModel.js) ligne 5-54
- [public/js/model/studentsModel.js](public/js/model/studentsModel.js) ligne 6
- [public/js/model/usersModel.js](public/js/model/usersModel.js) ligne 8-49
- [public/js/controller/scanController.js](public/js/controller/scanController.js) ligne 19

**ProblÃ¨me - 3 SystÃ¨mes DiffÃ©rents Coexistent:**

```javascript
// SYSTÃˆME 1 - Appels Ã  des fichiers PHP directs (NE FONCTIONNENT PAS)
fetch('php/api/searchMovements.php?q=...')           // movementsModel.js:6
fetch('php/api/addMovement.php', {...})              // movementsModel.js:32
fetch('php/api/updateMovement.php', {...})           // movementsModel.js:56
fetch('php/api/searchStudents.php?q=...')            // studentsModel.js:6
fetch('php/api/addUser.php', {...})                  // usersModel.js:8
fetch('php/api/deleteUser.php', {...})               // usersModel.js:40
fetch('php/api/updateUser.php', {...})               // usersModel.js:67

// SYSTÃˆME 2 - Routeur structurÃ© (Correct)
fetch('/scan/ajouter', {method: 'POST', ...})       // scanController.js:19

// SYSTÃˆME 3 - Chemins relatifs Ã  html/ (IncohÃ©rent)
fetch('html/scan.html')                             // scanView.js:10
fetch('html/management.html')                          // managementView.js:11
```

**Impact:** 
- Fichiers `/php/api/*.php` n'existent PAS dans le projet
- Le code JavaScript cherche des routes inexistantes
- Seul le routeur `/scan/ajouter` est implÃ©mentÃ©

**Ã€ Corriger - Unifier sur un systÃ¨me:**
```javascript
// Option 1: Utiliser le routeur PHP structurÃ© pour TOUT
fetch('/movements/search?q=...')
fetch('/movements/add', {method: 'POST', ...})
fetch('/students/search?q=...')
fetch('/users/add', {method: 'POST', ...})

// Option 2: CrÃ©er les fichiers API PHP (moins bon)
php/api/addMovement.php
php/api/searchMovements.php
php/api/searchStudents.php
php/api/addUser.php
```

---

### 4. **CRITIQUE - ContrÃ´leurs PHP Vides ou Incomplets**

**Localisation:**
| Fichier | Ã‰tat | Ligne |
|---------|------|-------|
| [app/controller/dashboardController.php](app/controller/dashboardController.php) | âŒ Vide (namespace uniquement) | 1-3 |
| [app/controller/managementController.php](app/controller/managementController.php) | âŒ Vide (namespace uniquement) | 1-3 |
| [app/controller/searchController.php](app/controller/searchController.php) | âŒ Vide (namespace uniquement) | 1-3 |
| [app/controller/absentController.php](app/controller/absentController.php) | âŒ Vide (namespace uniquement) | 1-3 |
| [app/controller/historicalController.php](app/controller/historicalController.php) | âŒ Vide (namespace uniquement) | 1-3 |
| [app/controller/scanController.php](app/controller/scanController.php) | âœ… Partiellement implÃ©mentÃ© | - |

**Routes ConcernÃ©es:**
```php
// routes.php - Ces routes ne fonctionneront PAS
'GET' => [
    '/dashboard' => ['DashboardController', 'index'],      // Pas d'implÃ©mentation!
    '/search' => ['SearchController', 'index'],            // Pas d'implÃ©mentation!
    '/absent' => ['AbsentController', 'index'],            // Pas d'implÃ©mentation!
    '/gestion' => ['ManagementController', 'index'],           // Pas d'implÃ©mentation!
    '/historical/{id}' => ['HistoricalController', 'show'], // Pas d'implÃ©mentation!
],
'POST' => [
    '/scan/ajouter' => ['ScanController', 'ajouter'],      // âœ… ImplÃ©mentÃ©
]
```

**Impact:**
- Le routeur cherchera les classes mais trouvera du code vide
- Les requÃªtes GET aux routes `/dashboard`, `/search`, `/absent`, `/gestion`, `/historical/{id}` Ã©choueront

---

### 5. **CRITIQUE - ContrÃ´leurs PHP Manquants ComplÃ¨tement**

**Localisation:** routes.php routes 1-9

**ContrÃ´leurs SollicitÃ©s mais Inexistants:**
```
['HomeController', 'index']      // RÃ©fÃ©rencÃ© dans routes.php mais aucun fichier!
['AuthController', 'verify']     // RÃ©fÃ©rencÃ© pour la route /login mais aucun fichier!
```

**Impact:**
- Route GET `/` (homepage) Ã©chouera avec "class not found"
- Route POST `/login` Ã©chouera avec "class not found"
- L'authentification est impossible

---

### 6. **CRITIQUE - Chemin de Configuration Incorrect**

**Localisation:** [app/core/dataBase.php](app/core/dataBase.php) ligne 12

**Code ProblÃ©matique:**
```php
$config = require __DIR__ . '../config/config.php';  // âŒ FAUX
```

**ProblÃ¨me:** Manque le `/` entre `__DIR__` et `..`
- `__DIR__` = `/app/core/`
- `__DIR__ . '../config/config.php'` = `/app/core../config/config.php` âŒ
- Devrait Ãªtre `/app/core/../config/config.php` = `/app/config/config.php` âœ…

**Ã€ Corriger:**
```php
$config = require __DIR__ . '/../config/config.php';  // âœ… CORRECT
```

**Impact:** La classe DataBase ne peut pas charger la configuration â†’ Connexion DB Ã©choue

---

### 7. **CRITIQUE - Erreur de Syntaxe PHP dans scanController**

**Localisation:** [app/controller/scanController.php](app/controller/scanController.php) ligne 18

**Code ProblÃ©matique:**
```php
$result = $model->addMovement($movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
]);
```

**ProblÃ¨me:** 
- Assigne une variable lors du passage de paramÃ¨tre
- Bien que techniquement valide en PHP, c'est une mauvaise pratique et source de confusion

**Ã€ Corriger:**
```php
$movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
];
$result = $model->addMovement($movementData);
```

---

## ðŸŸ  PROBLÃˆMES DE COMMUNICATION API

### 1. **IncohÃ©rence des ParamÃ¨tres API (Frontend â‰  Backend)**

**Frontend Envoie:**
```javascript
// movementsModel.js:45-54
const data = await this.model.save(movementData);
// Envoie: { student_id, movement_type }

fetch('/scan/ajouter', {
    method: 'POST',
    body: formData.append('student_id', movementData.student_id)
})
```

**Backend Attend:**
```php
// Mais la BD attend:
'id_etudiant' (pas 'student_id')
'type_passage' ENUM('entree_matin', 'sortie_midi', ...) 
             pas 'entry'/'exit'
```

**Mismatch Complet:**
| Frontend | Backend BD | Correspondance |
|----------|-----------|---|
| `student_id` | `id_etudiant` | âŒ Noms diffÃ©rents |
| `movement_type: 'entry'` | `type_passage: 'entree_matin'` | âŒ Valeurs incompatibles |
| `movement_type: 'exit'` | `type_passage: 'sortie_midi'` | âŒ Pas de mappage |

**Impact:** Les inserts Ã©choueront ou crÃ©eront des donnÃ©es invalides

---

### 2. **Session/Authentification Pas ImplÃ©mentÃ©e en Backend**

**Frontend:** [public/js/controller/sessionController.js](public/js/controller/sessionController.js) ligne 13-25

**Code ProblÃ©matique:**
```javascript
login(username, password) {
    // TODO: ImplÃ©menter la validation avec le backend PHP
    // Pour l'instant, simulation simple
    if(username && password) {
        // DÃ©terminer le rÃ´le basÃ© sur le username (Ã  remplacer par un vrai appel API)
        let role = 'user';
        if(username.includes('admin')) {
            role = 'administrateur';
        } else if(username.includes('gestion')) {
            role = 'administration';
        }
        sessionStorage.setItem('role', role);  // âŒ Simulation dangereuse!
    }
}
```

**ProblÃ¨mes:**
- âœ… La route `/login` existe (POST)
- âŒ Mais `AuthController` n'existe pas
- âŒ Le frontend ne valide pas avec le backend
- âŒ Le rÃ´le est dÃ©terminÃ© PAR LE FRONTEND (sÃ©curitÃ© breach!)
- âŒ StockÃ© dans `sessionStorage` (facilement modifiable cÃ´tÃ© client)

**Ã€ ImplÃ©menter:**
1. CrÃ©er `AuthController.php` avec mÃ©thode `verify()`
2. Frontend doit envoyer: `{username, password}`
3. Backend valide et retourne: `{success, role, token}`
4. Utiliser un vrai systÃ¨me de session/JWT

**Impact:** N'importe qui peut modifier le rÃ´le dans la console â†’ Bypass sÃ©curitÃ©

---

### 3. **Pas de Gestion d'Erreur CentralisÃ©e API**

**ProblÃ¨me:** Chaque modÃ¨le JS gÃ¨re les erreurs diffÃ©remment:
```javascript
// movementsModel.js:8-15
.then(response => response.json())
.then(data => {
    if(data.success) {
        alert('SuccÃ¨s!');  // âŒ Utilise alert()
    }
})
.catch(error => {
    alert('Erreur');  // âŒ Erreur simple
})
```

**Impact:** Pas de traÃ§age, logins, ou gestion cohÃ©rente

---

### 4. **RÃ©ponses API Ã‰chouÃ©es (404/500)**

**Cas:**
- Le frontend appelle `/scan/ajouter` âœ…
- Mais le backend attend `student_id` en `$_POST`
- Le frontend envoie `FormData` âœ…
- Cependant, il n'y a pas de vÃ©rification si les donnÃ©es sont vraiment envoyÃ©es

**En ScanController.php ligne 15:**
```php
$studentId = $_POST['student_id'] ?? null;
```

**ProblÃ¨me:** Pas de vÃ©rification que c'est vraiment FormData avec ce champ

---

## ðŸŸ¡ PROBLÃˆMES D'ARCHITECTURE

### 1. **MÃ©lange de 2 Approches de Routing**

**Approche 1 - Chargement HTML Dynamique (SPA):**
```javascript
// routeController.js
fetch('html/scan.html')
    .then(response => response.text())
    .then(data => container.innerHTML = data)
```

**Approche 2 - Routeur Backend PHP StructurÃ©:**
```php
// routes.php
'GET' => [
    '/dashboard' => ['DashboardController', 'index'],
]
```

**ProblÃ¨me:** 
- Le frontend utilise un SPA avec chargement HTML dynamique
- Mais routes.php est aussi un routeur
- â†’ Les 2 systÃ¨mes ne sont pas coordonnÃ©s!

**Questions Non RÃ©pondues:**
- Qui gÃ©nÃ¨re les pages? Backend PHP ou HTML statique?
- Le backend doit-il retourner JSON ou HTML?
- Comment la validation des VUEs fonctionne-t-elle cotÃ© server?

---

### 2. **Structure du Projet Confuse**

```
Code/
â”œâ”€â”€ app/                    (Backend PHP POO)
â”‚   â”œâ”€â”€ controller/         (Vides pour la plupart!)
â”‚   â”œâ”€â”€ model/              (ModÃ¨les OK)
â”‚   â”œâ”€â”€ view/               (Vues PHP - jamais utilisÃ©es?)
â”‚   â””â”€â”€ core/
â”œâ”€â”€ html/                   (HTML statiques chargeÃ©s par JS)
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ index.php          (Entry point - OK)
â”‚   â””â”€â”€ js/
â”‚       â”œâ”€â”€ controller/    (ContrÃ´leurs JS - OK)
â”‚       â”œâ”€â”€ model/         (ModÃ¨les JS - problÃ¨mes API)
â”‚       â””â”€â”€ view/          (Vues JS - OK)
â””â”€â”€ vendor/               (Composer autoload)
```

**Questions:**
- Pourquoi des fichiers view.php dans app/view/ s'il y a des vues JS?
- Les fichiers html/ statiques ne sont jamais gÃ©nÃ©rÃ©s par le backend?
- L'architecture est-elle vraiment MVC ou SPA?

---

### 3. **Pas d'IntÃ©gration Frontend-Backend CohÃ©rente**

| Aspect | Frontend | Backend | CohÃ©rence |
|--------|----------|---------|-----------|
| Routage | SPA (JS) | Router structurÃ© (PHP) | âŒ DÃ©salignÃ© |
| API | Fetch vers `php/api/*.php` | Routes du routeur `/...` | âŒ Mismatch |
| DonnÃ©es | `student_id`, `movement_type: 'entry'` | `id_etudiant`, `type_passage: 'entree_matin'` | âŒ DiffÃ©rent |
| Auth | StorageSession (cÃ´tÃ© client) | AuthController (n'existe pas) | âŒ Pas impl. |
| Vues | HTML chargÃ©s dynamiquement | Vues PHP (jamais utilisÃ©es) | âŒ Confus |

---

## ðŸ“ FICHIERS INCOMPLETS/MANQUANTS

### A. ContrÃ´leurs PHP Vides (Ã€ ImplÃ©menter)

| Fichier | Ã‰tat | Ã€ Faire |
|---------|------|---------|
| [app/controller/dashboardController.php](app/controller/dashboardController.php) | âŒ Vide | ImplÃ©menter `index()` pour retourner donnÃ©es dashboard |
| [app/controller/managementController.php](app/controller/managementController.php) | âŒ Vide | ImplÃ©menter `index()` et `ajouter()` pour gestion utilisateurs |
| [app/controller/searchController.php](app/controller/searchController.php) | âŒ Vide | ImplÃ©menter `index()` pour recherche Ã©tudiants |
| [app/controller/absentController.php](app/controller/absentController.php) | âŒ Vide | ImplÃ©menter `index()` pour gestion absences |
| [app/controller/historicalController.php](app/controller/historicalController.php) | âŒ Vide | ImplÃ©menter `show()` pour historique par Ã©tudiant |

### B. ContrÃ´leurs PHP Manquants ComplÃ¨tement

| Fichier | Raison | Ã€ Faire |
|---------|--------|---------|
| `app/controller/HomeController.php` | RÃ©fÃ©rencÃ© dans routes.php | CrÃ©er avec `index()` pour accueil |
| `app/controller/AuthController.php` | RÃ©fÃ©rencÃ© pour /login | CrÃ©er avec `verify()` pour authentification |

### C. Fichiers API PHP Manquants

Ces fichiers sont appelÃ©s par le frontend mais n'existent pas:
```
php/api/addMovement.php           âŒ Manquant (appelÃ© par movementsModel.js)
php/api/searchMovements.php       âŒ Manquant (appelÃ© par movementsModel.js)
php/api/updateMovement.php        âŒ Manquant (appelÃ© par movementsModel.js)
php/api/searchStudents.php        âŒ Manquant (appelÃ© par studentsModel.js)
php/api/addUser.php               âŒ Manquant (appelÃ© par usersModel.js)
php/api/deleteUser.php            âŒ Manquant (appelÃ© par usersModel.js)
php/api/updateUser.php            âŒ Manquant (appelÃ© par usersModel.js)
```

**Option pour Corriger:**
- âŒ CrÃ©er tous ces fichiers (mauvaise pratique, code dupliquÃ©)
- âœ… Utiliser le routeur existant et mapper les routes (correct)

### D. Couche API CentralisÃ©e

| Fichier | Ã‰tat | Ã€ Faire |
|---------|------|---------|
| [public/js/api.js](public/js/api.js) | âŒ Vide | CrÃ©er classe API centralisÃ©e pour tous les fetch() |

### E. Configuration

| Fichier | Ã‰tat | ProblÃ¨me |
|---------|------|---------|
| `public/.htaccess` | âŒ Manquant | Pour les URLs rewritten (`/scan/ajouter` etc.) |
| `app/view/scanView.php` | âŒ Vide/Inutile | Jamais chargÃ©e (frontend utilise HTML JS) |
| `app/view/dashboardView.php` | âŒ Vide/Inutile | Jamais chargÃ©e |

---

## ðŸ” FICHIERS Ã€ REVOIR PRIORITAIREMENT

### Tier 1 - CRITIQUE (Blockers)

| # | Fichier | Ligne | ProblÃ¨me | Action |
|---|---------|-------|---------|--------|
| 1 | [app/core/dataBase.php](app/core/dataBase.php) | 12 | Chemin config incorrect | Corriger `__DIR__ . '../...'` |
| 2 | [app/model/studentsModel.php](app/model/studentsModel.php) | 12-24 | Noms de tables faux | Remplacer `students` par `etudiants` |
| 3 | [app/model/movementsModel.php](app/model/movementsModel.php) | 19-55 | Noms de tables/colonnes faux | Corriger noms pour correspondre Ã  BD |
| 4 | [app/model/usersModel.php](app/model/usersModel.php) | Multiple | Mix `users`/`utilisateurs` | Uniformiser sur `utilisateurs` |
| 5 | [public/js/model/movementsModel.js](public/js/model/movementsModel.js) | 5-90 | API routes incohÃ©rentes | Changer tous les `php/api/*.php` en routes |
| 6 | [public/js/model/studentsModel.js](public/js/model/studentsModel.js) | 6 | API route incorrecte | Changer `php/api/searchStudents.php` |
| 7 | [public/js/model/usersModel.js](public/js/model/usersModel.js) | 8-92 | API routes incorrectes | Changer tous les `php/api/*` |
| 8 | [app/core/router.php](app/core/router.php) | 36 | ContrÃ´leur path error | Devrait chercher `App\\Controller\\` pas `App\\Controllers\\` |

### Tier 2 - IMPORTANT (Ã€ ImplÃ©menter)

| # | Fichier | Action |
|---|---------|--------|
| 1 | [app/controller/dashboardController.php](app/controller/dashboardController.php) | ImplÃ©menter l'index() |
| 2 | [app/controller/managementController.php](app/controller/managementController.php) | ImplÃ©menter index() et ajouter() |
| 3 | [app/controller/searchController.php](app/controller/searchController.php) | ImplÃ©menter index() |
| 4 | [app/controller/absentController.php](app/controller/absentController.php) | ImplÃ©menter index() |
| 5 | [app/controller/historicalController.php](app/controller/historicalController.php) | ImplÃ©menter show() |
| 6 | `app/controller/AuthController.php` | CrÃ©er avec verify() |
| 7 | `app/controller/HomeController.php` | CrÃ©er avec index() |
| 8 | [public/js/api.js](public/js/api.js) | CrÃ©er API centralisÃ©e |

### Tier 3 - AMÃ‰LIORATIONS (Ã€ RÃ©viser)

| # | Fichier | RÃ©vision |
|---|---------|----------|
| 1 | [public/js/controller/sessionController.js](public/js/controller/sessionController.js) | ImplÃ©menter vraie auth backend |
| 2 | [public/js/main.js](public/js/main.js) | Pas de gestion erreur globale |
| 3 | routes.php | Clarifier: SPA ou routeur backend? |
| 4 | Architecture gÃ©nÃ©rale | Choisir: MVC traditionnel ou SPA? |

---

## ðŸ“‹ RÃ‰SUMÃ‰ DES ACTIONS REQUISES

### IMMÃ‰DIAT (Jour 1)

**[URGENT] 1. Corriger la CohÃ©rence Base de DonnÃ©es:**
- [ ] Remplacer `students` â†’ `etudiants` dans StudentsModel.php
- [ ] Remplacer `movements` â†’ `passages` dans MovementsModel.php  
- [ ] Uniformiser les noms dans UsersModel.php (`utilisateurs`)
- [ ] Mapper les colonnes: `student_id` â†’ `id_etudiant`, `movement_type` â†’ `type_passage`

**[URGENT] 2. Corriger les Chemins et Syntaxe PHP:**
- [ ] Corriger `dataBase.php` ligne 12: `__DIR__ . '/../config/config.php'`
- [ ] Corriger `router.php` ligne 36: `App\\Controller\\` (vÃ©rifier le rÃ©pertoire exact)
- [ ] Corriger `scanController.php` ligne 18: sÃ©parer l'assignation

**[URGENT] 3. Unifier les Routes API:**
- [ ] DÃ©cider: Utiliser routeur PHP OU fichiers API sÃ©parÃ©s (recommandÃ©: routeur)
- [ ] Mettre Ã  jour tous les modÃ¨les JS pour utiliser les bonnes routes
- [ ] CrÃ©er les nouvelles routes dans routes.php

### COURT TERME (Jour 2-3)

**[IMPORTANT] 4. ImplÃ©menter les ContrÃ´leurs Vides:**
- [ ] dashboardController.php - index()
- [ ] ManagementController.php - index(), ajouter(), supprimer()
- [ ] searchController.php - index()
- [ ] absentController.php - index()
- [ ] historicalController.php - show()
- [ ] CrÃ©er AuthController.php - verify()
- [ ] CrÃ©er HomeController.php - index()

**[IMPORTANT] 5. ImplÃ©menter API CentralisÃ©e:**
- [ ] CrÃ©er classe Api.js pour tous les fetch()
- [ ] Gestion erreur centralisÃ©e
- [ ] Intercepteurs pour tokens/auth

**[IMPORTANT] 6. ImplÃ©menter l'Authentification:**
- [ ] AuthController.php valide credentials
- [ ] Frontend appelle /login avec credentials
- [ ] Backend retourne JWT ou session token
- [ ] Stocker de maniÃ¨re sÃ©curisÃ©e (pas sessionStorage!)

### MOYEN TERME (Jour 4-5)

**[RECOMMANDÃ‰] 7. Clarifier l'Architecture:** 
- [ ] DÃ©cider: SPA complÃ¨te (HTML+JS cÃ´tÃ© client) OU MVC traditionnel (HTML gÃ©nÃ©rÃ© par PHP)  
- [ ] Si SPA: le backend ne retourne que JSON de l'API REST
- [ ] Si MVC: le backend gÃ©nÃ¨re le HTML (pas besoin des vues JS)

**[RECOMMANDÃ‰] 8. Tester ComplÃ¨tement:**
- [ ] Tester crÃ©ation compte utilisateur (/gestion/ajouter)
- [ ] Tester scan Ã©tudiant (/scan/ajouter)
- [ ] Tester recherche Ã©tudiant (GET /search)
- [ ] Tester historique (/historical/{id})

---

## ðŸ” PROBLÃˆMES DE SÃ‰CURITÃ‰ IDENTIFIÃ‰S

### CRITIQUE

1. **RÃ´le DÃ©terminÃ© par le Frontend**
   - sessionController.js dÃ©termine le rÃ´le en local (facilement contournable)
   - Doit Ãªtre validÃ© par le backend

2. **SessionStorage Non SÃ©curisÃ©**
   - Les donnÃ©es de session peuvent Ãªtre modifiÃ©es par JavaScript
   - Utiliser les sessions PHP ou JWT signÃ©

3. **Insertion Directe de ParamÃ¨tres**
   - Les modÃ¨les PHP ne valident pas les entrÃ©es
   - Risquer injection SQL (bien attÃ©nuÃ© par les prepared statements)
   - Ajouter validations

4. **Mots de Passe en Clair dans Test Data**
   - INSERT utilisateurs sortie_ecole.sql contient mots de passe en clair
   - Utiliser password_hash() (dÃ©jÃ  fait en createUser mais pas dans data de test)

---

## ðŸ“Š STATISTIQUES

| MÃ©trique | Valeur |
|----------|--------|
| ContrÃ´leurs PHP implÃ©mentÃ©s | 1/7 (14%) |
| ContrÃ´leurs PHP vides | 5/7 (71%) |
| Fichiers API JS correctement routÃ©s | 1/8 (12%) |
| IncohÃ©rences frontend-backend | 10+ |
| Routes exÃ©cutables | 1/5 en GET, 1/5 en POST |
| Taux de complÃ©tude du projet | ~15% |

---

## ðŸŽ¯ PRIORITÃ‰ D'ACTION

```
1. Corriger noms tables (BLOQUANT TOTAL)
   â†“
2. Corriger chemins PHP (BLOQUANT)
   â†“  
3. Unifier routes API (BLOQUANT)
   â†“
4. ImplÃ©menter contrÃ´leurs vides
   â†“
5. ImplÃ©menter authentification
   â†“
6. ImplÃ©menter API centralisÃ©e JS
   â†“
7. Tests complets
```

---

## ðŸ“ NOTES FINALES

**Ã‰tat du Projet:** ðŸ”´ **NON FONCTIONNEL**

Le projet ne peut PAS fonctionner actuellement car:
- Les noms de tables ne correspondent pas
- Les chemins PHP sont incorrects
- Les routes API cÃ´tÃ© frontend pointent vers des fichiers inexistants
- Les contrÃ´leurs ne sont pas implÃ©mentÃ©s
- L'authentification est simulÃ©e

**Temps EstimÃ© de Correction:** 5-7 jours pour dÃ©veloppeur senior

**Recommandation:** Corriger d'abord les 3 premiers blockers avant toute autre chose.



# RAPPORT D'ANALYSE COMPLÈTE - Projet MVC Scan Sorties Étudiants

**Date:** 25 mars 2026  
**Type:** Audit technique - Frontend JavaScript POO + Backend PHP POO  
**Priorité:** CRITIQUE - Nombreux blocages empêchant le fonctionnement

---

## 📋 TABLE DES MATIÈRES
1. [Bugs Critiques](#bugs-critiques)
2. [Problèmes de Communication API](#problèmes-de-communication-api)
3. [Problèmes d'Architecture](#problèmes-darchitecture)
4. [Fichiers Incomplets/Manquants](#fichiersincompletsmanquants)
5. [Fichiers à Revoir Prioritairement](#fichiers-à-revoir-prioritairement)
6. [Résumé des Actions Requises](#résumé-des-actions-requises)

---

## 🔴 BUGS CRITIQUES

### 1. **CRITIQUE - Incohérence des Noms de Tables (Frontend ≠ Database ≠ Backend)**

**Localisation:**
- [app/core/dataBase.php](app/core/dataBase.php) - Config générale
- [app/model/studentsModel.php](app/model/studentsModel.php) - Requêtes
- [app/model/movementsModel.php](app/model/movementsModel.php) - Requêtes
- [app/model/usersModel.php](app/model/usersModel.php) - Requêtes
- [Creation DB-Tables sortie_ecole.sql](Creation%20DB-Tables%20sortie_ecole.sql) - Schéma BD

**Problème:**
```
DATABASE SQL              BACKEND PHP MODELS         FRONTEND JAVASCRIPT
============              ======================      ===================
etudiants        -----→  SELECT * FROM students  ←--- utilisé dans API
passages         -----→  INSERT INTO movements   ←--- appels fetch
utilisateurs     -----→  SELECT * FROM users     ←--- envoie student_id
```

**Détails:**
- **Base de données** crée `etudiants`, `passages`, `utilisateurs`
- **StudentsModel.php ligne 12** exécute `SELECT * FROM students` ❌
- **MovementsModel.php ligne 19** exécute `INSERT INTO movements` ❌
- **UsersModel.php** exécute `SELECT * FROM utilisateurs` mais utilise aussi `users` inconsistently ❌
- **Frontend JavaScript** envoie `student_id` mais la DB attend `id_etudiant` ❌
- **Frontend** envoie `movement_type: 'entry'` mais la DB attend type_passage ENUM ❌

**Impact:** Les requêtes échoueront avec erreurs "table not found"

**À Corriger:**
```php
// AVANT (FAUX):
SELECT * FROM students
INSERT INTO movements

// APRÈS (CORRECT):
SELECT * FROM etudiants
INSERT INTO passages
```

---

### 2. **CRITIQUE - Fichier api.js Complètement Vide**

**Localisation:** [public/js/api.js](public/js/api.js)

**Problème:** 
- Le fichier existe mais est vide
- Aucune couche API centralisée
- Chaque modèle fait son propre `fetch()` sans cohérence

**Impact:** 
- Code dupliqué dans tous les modèles JS
- Pas de gestion centralisée d'erreurs
- Pas d'intercepteurs API

**À Faire:**
Créer une classe API centralisée pour tous les appels HTTP.

---

### 3. **CRITIQUE - Appels API Incohérents (Chemins Différents)**

**Localisation:**
- [public/js/model/movementsModel.js](public/js/model/movementsModel.js) ligne 5-54
- [public/js/model/studentsModel.js](public/js/model/studentsModel.js) ligne 6
- [public/js/model/usersModel.js](public/js/model/usersModel.js) ligne 8-49
- [public/js/controller/scanController.js](public/js/controller/scanController.js) ligne 19

**Problème - 3 Systèmes Différents Coexistent:**

```javascript
// SYSTÈME 1 - Appels à des fichiers PHP directs (NE FONCTIONNENT PAS)
fetch('php/api/searchMovements.php?q=...')           // movementsModel.js:6
fetch('php/api/addMovement.php', {...})              // movementsModel.js:32
fetch('php/api/updateMovement.php', {...})           // movementsModel.js:56
fetch('php/api/searchStudents.php?q=...')            // studentsModel.js:6
fetch('php/api/addUser.php', {...})                  // usersModel.js:8
fetch('php/api/deleteUser.php', {...})               // usersModel.js:40
fetch('php/api/updateUser.php', {...})               // usersModel.js:67

// SYSTÈME 2 - Routeur structuré (Correct)
fetch('/scan/ajouter', {method: 'POST', ...})       // scanController.js:19

// SYSTÈME 3 - Chemins relatifs à html/ (Incohérent)
fetch('html/scan.html')                             // scanView.js:10
fetch('html/gestion.html')                          // gestionView.js:11
```

**Impact:** 
- Fichiers `/php/api/*.php` n'existent PAS dans le projet
- Le code JavaScript cherche des routes inexistantes
- Seul le routeur `/scan/ajouter` est implémenté

**À Corriger - Unifier sur un système:**
```javascript
// Option 1: Utiliser le routeur PHP structuré pour TOUT
fetch('/movements/search?q=...')
fetch('/movements/add', {method: 'POST', ...})
fetch('/students/search?q=...')
fetch('/users/add', {method: 'POST', ...})

// Option 2: Créer les fichiers API PHP (moins bon)
php/api/addMovement.php
php/api/searchMovements.php
php/api/searchStudents.php
php/api/addUser.php
```

---

### 4. **CRITIQUE - Contrôleurs PHP Vides ou Incomplets**

**Localisation:**
| Fichier | État | Ligne |
|---------|------|-------|
| [app/controller/dashboardController.php](app/controller/dashboardController.php) | ❌ Vide (namespace uniquement) | 1-3 |
| [app/controller/gestionController.php](app/controller/gestionController.php) | ❌ Vide (namespace uniquement) | 1-3 |
| [app/controller/searchController.php](app/controller/searchController.php) | ❌ Vide (namespace uniquement) | 1-3 |
| [app/controller/absentController.php](app/controller/absentController.php) | ❌ Vide (namespace uniquement) | 1-3 |
| [app/controller/historicalController.php](app/controller/historicalController.php) | ❌ Vide (namespace uniquement) | 1-3 |
| [app/controller/scanController.php](app/controller/scanController.php) | ✅ Partiellement implémenté | - |

**Routes Concernées:**
```php
// routes.php - Ces routes ne fonctionneront PAS
'GET' => [
    '/dashboard' => ['DashboardController', 'index'],      // Pas d'implémentation!
    '/search' => ['SearchController', 'index'],            // Pas d'implémentation!
    '/absent' => ['AbsentController', 'index'],            // Pas d'implémentation!
    '/gestion' => ['GestionController', 'index'],           // Pas d'implémentation!
    '/historical/{id}' => ['HistoricalController', 'show'], // Pas d'implémentation!
],
'POST' => [
    '/scan/ajouter' => ['ScanController', 'ajouter'],      // ✅ Implémenté
]
```

**Impact:**
- Le routeur cherchera les classes mais trouvera du code vide
- Les requêtes GET aux routes `/dashboard`, `/search`, `/absent`, `/gestion`, `/historical/{id}` échoueront

---

### 5. **CRITIQUE - Contrôleurs PHP Manquants Complètement**

**Localisation:** routes.php routes 1-9

**Contrôleurs Sollicités mais Inexistants:**
```
['HomeController', 'index']      // Référencé dans routes.php mais aucun fichier!
['AuthController', 'verify']     // Référencé pour la route /login mais aucun fichier!
```

**Impact:**
- Route GET `/` (homepage) échouera avec "class not found"
- Route POST `/login` échouera avec "class not found"
- L'authentification est impossible

---

### 6. **CRITIQUE - Chemin de Configuration Incorrect**

**Localisation:** [app/core/dataBase.php](app/core/dataBase.php) ligne 12

**Code Problématique:**
```php
$config = require __DIR__ . '../config/config.php';  // ❌ FAUX
```

**Problème:** Manque le `/` entre `__DIR__` et `..`
- `__DIR__` = `/app/core/`
- `__DIR__ . '../config/config.php'` = `/app/core../config/config.php` ❌
- Devrait être `/app/core/../config/config.php` = `/app/config/config.php` ✅

**À Corriger:**
```php
$config = require __DIR__ . '/../config/config.php';  // ✅ CORRECT
```

**Impact:** La classe DataBase ne peut pas charger la configuration → Connexion DB échoue

---

### 7. **CRITIQUE - Erreur de Syntaxe PHP dans scanController**

**Localisation:** [app/controller/scanController.php](app/controller/scanController.php) ligne 18

**Code Problématique:**
```php
$result = $model->addMovement($movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
]);
```

**Problème:** 
- Assigne une variable lors du passage de paramètre
- Bien que techniquement valide en PHP, c'est une mauvaise pratique et source de confusion

**À Corriger:**
```php
$movementData = [
    'student_id' => $studentId,
    'movement_type' => 'entry'
];
$result = $model->addMovement($movementData);
```

---

## 🟠 PROBLÈMES DE COMMUNICATION API

### 1. **Incohérence des Paramètres API (Frontend ≠ Backend)**

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
| `student_id` | `id_etudiant` | ❌ Noms différents |
| `movement_type: 'entry'` | `type_passage: 'entree_matin'` | ❌ Valeurs incompatibles |
| `movement_type: 'exit'` | `type_passage: 'sortie_midi'` | ❌ Pas de mappage |

**Impact:** Les inserts échoueront ou créeront des données invalides

---

### 2. **Session/Authentification Pas Implémentée en Backend**

**Frontend:** [public/js/controller/sessionController.js](public/js/controller/sessionController.js) ligne 13-25

**Code Problématique:**
```javascript
login(username, password) {
    // TODO: Implémenter la validation avec le backend PHP
    // Pour l'instant, simulation simple
    if(username && password) {
        // Déterminer le rôle basé sur le username (à remplacer par un vrai appel API)
        let role = 'user';
        if(username.includes('admin')) {
            role = 'administrateur';
        } else if(username.includes('gestion')) {
            role = 'administration';
        }
        sessionStorage.setItem('role', role);  // ❌ Simulation dangereuse!
    }
}
```

**Problèmes:**
- ✅ La route `/login` existe (POST)
- ❌ Mais `AuthController` n'existe pas
- ❌ Le frontend ne valide pas avec le backend
- ❌ Le rôle est déterminé PAR LE FRONTEND (sécurité breach!)
- ❌ Stocké dans `sessionStorage` (facilement modifiable côté client)

**À Implémenter:**
1. Créer `AuthController.php` avec méthode `verify()`
2. Frontend doit envoyer: `{username, password}`
3. Backend valide et retourne: `{success, role, token}`
4. Utiliser un vrai système de session/JWT

**Impact:** N'importe qui peut modifier le rôle dans la console → Bypass sécurité

---

### 3. **Pas de Gestion d'Erreur Centralisée API**

**Problème:** Chaque modèle JS gère les erreurs différemment:
```javascript
// movementsModel.js:8-15
.then(response => response.json())
.then(data => {
    if(data.success) {
        alert('Succès!');  // ❌ Utilise alert()
    }
})
.catch(error => {
    alert('Erreur');  // ❌ Erreur simple
})
```

**Impact:** Pas de traçage, logins, ou gestion cohérente

---

### 4. **Réponses API Échouées (404/500)**

**Cas:**
- Le frontend appelle `/scan/ajouter` ✅
- Mais le backend attend `student_id` en `$_POST`
- Le frontend envoie `FormData` ✅
- Cependant, il n'y a pas de vérification si les données sont vraiment envoyées

**En ScanController.php ligne 15:**
```php
$studentId = $_POST['student_id'] ?? null;
```

**Problème:** Pas de vérification que c'est vraiment FormData avec ce champ

---

## 🟡 PROBLÈMES D'ARCHITECTURE

### 1. **Mélange de 2 Approches de Routing**

**Approche 1 - Chargement HTML Dynamique (SPA):**
```javascript
// routeController.js
fetch('html/scan.html')
    .then(response => response.text())
    .then(data => container.innerHTML = data)
```

**Approche 2 - Routeur Backend PHP Structuré:**
```php
// routes.php
'GET' => [
    '/dashboard' => ['DashboardController', 'index'],
]
```

**Problème:** 
- Le frontend utilise un SPA avec chargement HTML dynamique
- Mais routes.php est aussi un routeur
- → Les 2 systèmes ne sont pas coordonnés!

**Questions Non Répondues:**
- Qui génère les pages? Backend PHP ou HTML statique?
- Le backend doit-il retourner JSON ou HTML?
- Comment la validation des VUEs fonctionne-t-elle coté server?

---

### 2. **Structure du Projet Confuse**

```
Code/
├── app/                    (Backend PHP POO)
│   ├── controller/         (Vides pour la plupart!)
│   ├── model/              (Modèles OK)
│   ├── view/               (Vues PHP - jamais utilisées?)
│   └── core/
├── html/                   (HTML statiques chargeés par JS)
├── public/
│   ├── index.php          (Entry point - OK)
│   └── js/
│       ├── controller/    (Contrôleurs JS - OK)
│       ├── model/         (Modèles JS - problèmes API)
│       └── view/          (Vues JS - OK)
└── vendor/               (Composer autoload)
```

**Questions:**
- Pourquoi des fichiers view.php dans app/view/ s'il y a des vues JS?
- Les fichiers html/ statiques ne sont jamais générés par le backend?
- L'architecture est-elle vraiment MVC ou SPA?

---

### 3. **Pas d'Intégration Frontend-Backend Cohérente**

| Aspect | Frontend | Backend | Cohérence |
|--------|----------|---------|-----------|
| Routage | SPA (JS) | Router structuré (PHP) | ❌ Désaligné |
| API | Fetch vers `php/api/*.php` | Routes du routeur `/...` | ❌ Mismatch |
| Données | `student_id`, `movement_type: 'entry'` | `id_etudiant`, `type_passage: 'entree_matin'` | ❌ Différent |
| Auth | StorageSession (côté client) | AuthController (n'existe pas) | ❌ Pas impl. |
| Vues | HTML chargés dynamiquement | Vues PHP (jamais utilisées) | ❌ Confus |

---

## 📁 FICHIERS INCOMPLETS/MANQUANTS

### A. Contrôleurs PHP Vides (À Implémenter)

| Fichier | État | À Faire |
|---------|------|---------|
| [app/controller/dashboardController.php](app/controller/dashboardController.php) | ❌ Vide | Implémenter `index()` pour retourner données dashboard |
| [app/controller/gestionController.php](app/controller/gestionController.php) | ❌ Vide | Implémenter `index()` et `ajouter()` pour gestion utilisateurs |
| [app/controller/searchController.php](app/controller/searchController.php) | ❌ Vide | Implémenter `index()` pour recherche étudiants |
| [app/controller/absentController.php](app/controller/absentController.php) | ❌ Vide | Implémenter `index()` pour gestion absences |
| [app/controller/historicalController.php](app/controller/historicalController.php) | ❌ Vide | Implémenter `show()` pour historique par étudiant |

### B. Contrôleurs PHP Manquants Complètement

| Fichier | Raison | À Faire |
|---------|--------|---------|
| `app/controller/HomeController.php` | Référencé dans routes.php | Créer avec `index()` pour accueil |
| `app/controller/AuthController.php` | Référencé pour /login | Créer avec `verify()` pour authentification |

### C. Fichiers API PHP Manquants

Ces fichiers sont appelés par le frontend mais n'existent pas:
```
php/api/addMovement.php           ❌ Manquant (appelé par movementsModel.js)
php/api/searchMovements.php       ❌ Manquant (appelé par movementsModel.js)
php/api/updateMovement.php        ❌ Manquant (appelé par movementsModel.js)
php/api/searchStudents.php        ❌ Manquant (appelé par studentsModel.js)
php/api/addUser.php               ❌ Manquant (appelé par usersModel.js)
php/api/deleteUser.php            ❌ Manquant (appelé par usersModel.js)
php/api/updateUser.php            ❌ Manquant (appelé par usersModel.js)
```

**Option pour Corriger:**
- ❌ Créer tous ces fichiers (mauvaise pratique, code dupliqué)
- ✅ Utiliser le routeur existant et mapper les routes (correct)

### D. Couche API Centralisée

| Fichier | État | À Faire |
|---------|------|---------|
| [public/js/api.js](public/js/api.js) | ❌ Vide | Créer classe API centralisée pour tous les fetch() |

### E. Configuration

| Fichier | État | Problème |
|---------|------|---------|
| `public/.htaccess` | ❌ Manquant | Pour les URLs rewritten (`/scan/ajouter` etc.) |
| `app/view/scanView.php` | ❌ Vide/Inutile | Jamais chargée (frontend utilise HTML JS) |
| `app/view/dashboardView.php` | ❌ Vide/Inutile | Jamais chargée |

---

## 🔍 FICHIERS À REVOIR PRIORITAIREMENT

### Tier 1 - CRITIQUE (Blockers)

| # | Fichier | Ligne | Problème | Action |
|---|---------|-------|---------|--------|
| 1 | [app/core/dataBase.php](app/core/dataBase.php) | 12 | Chemin config incorrect | Corriger `__DIR__ . '../...'` |
| 2 | [app/model/studentsModel.php](app/model/studentsModel.php) | 12-24 | Noms de tables faux | Remplacer `students` par `etudiants` |
| 3 | [app/model/movementsModel.php](app/model/movementsModel.php) | 19-55 | Noms de tables/colonnes faux | Corriger noms pour correspondre à BD |
| 4 | [app/model/usersModel.php](app/model/usersModel.php) | Multiple | Mix `users`/`utilisateurs` | Uniformiser sur `utilisateurs` |
| 5 | [public/js/model/movementsModel.js](public/js/model/movementsModel.js) | 5-90 | API routes incohérentes | Changer tous les `php/api/*.php` en routes |
| 6 | [public/js/model/studentsModel.js](public/js/model/studentsModel.js) | 6 | API route incorrecte | Changer `php/api/searchStudents.php` |
| 7 | [public/js/model/usersModel.js](public/js/model/usersModel.js) | 8-92 | API routes incorrectes | Changer tous les `php/api/*` |
| 8 | [app/core/router.php](app/core/router.php) | 36 | Contrôleur path error | Devrait chercher `App\\Controller\\` pas `App\\Controllers\\` |

### Tier 2 - IMPORTANT (À Implémenter)

| # | Fichier | Action |
|---|---------|--------|
| 1 | [app/controller/dashboardController.php](app/controller/dashboardController.php) | Implémenter l'index() |
| 2 | [app/controller/gestionController.php](app/controller/gestionController.php) | Implémenter index() et ajouter() |
| 3 | [app/controller/searchController.php](app/controller/searchController.php) | Implémenter index() |
| 4 | [app/controller/absentController.php](app/controller/absentController.php) | Implémenter index() |
| 5 | [app/controller/historicalController.php](app/controller/historicalController.php) | Implémenter show() |
| 6 | `app/controller/AuthController.php` | Créer avec verify() |
| 7 | `app/controller/HomeController.php` | Créer avec index() |
| 8 | [public/js/api.js](public/js/api.js) | Créer API centralisée |

### Tier 3 - AMÉLIORATIONS (À Réviser)

| # | Fichier | Révision |
|---|---------|----------|
| 1 | [public/js/controller/sessionController.js](public/js/controller/sessionController.js) | Implémenter vraie auth backend |
| 2 | [public/js/main.js](public/js/main.js) | Pas de gestion erreur globale |
| 3 | routes.php | Clarifier: SPA ou routeur backend? |
| 4 | Architecture générale | Choisir: MVC traditionnel ou SPA? |

---

## 📋 RÉSUMÉ DES ACTIONS REQUISES

### IMMÉDIAT (Jour 1)

**[URGENT] 1. Corriger la Cohérence Base de Données:**
- [ ] Remplacer `students` → `etudiants` dans StudentsModel.php
- [ ] Remplacer `movements` → `passages` dans MovementsModel.php  
- [ ] Uniformiser les noms dans UsersModel.php (`utilisateurs`)
- [ ] Mapper les colonnes: `student_id` → `id_etudiant`, `movement_type` → `type_passage`

**[URGENT] 2. Corriger les Chemins et Syntaxe PHP:**
- [ ] Corriger `dataBase.php` ligne 12: `__DIR__ . '/../config/config.php'`
- [ ] Corriger `router.php` ligne 36: `App\\Controller\\` (vérifier le répertoire exact)
- [ ] Corriger `scanController.php` ligne 18: séparer l'assignation

**[URGENT] 3. Unifier les Routes API:**
- [ ] Décider: Utiliser routeur PHP OU fichiers API séparés (recommandé: routeur)
- [ ] Mettre à jour tous les modèles JS pour utiliser les bonnes routes
- [ ] Créer les nouvelles routes dans routes.php

### COURT TERME (Jour 2-3)

**[IMPORTANT] 4. Implémenter les Contrôleurs Vides:**
- [ ] dashboardController.php - index()
- [ ] gestionController.php - index(), ajouter(), supprimer()
- [ ] searchController.php - index()
- [ ] absentController.php - index()
- [ ] historicalController.php - show()
- [ ] Créer AuthController.php - verify()
- [ ] Créer HomeController.php - index()

**[IMPORTANT] 5. Implémenter API Centralisée:**
- [ ] Créer classe Api.js pour tous les fetch()
- [ ] Gestion erreur centralisée
- [ ] Intercepteurs pour tokens/auth

**[IMPORTANT] 6. Implémenter l'Authentification:**
- [ ] AuthController.php valide credentials
- [ ] Frontend appelle /login avec credentials
- [ ] Backend retourne JWT ou session token
- [ ] Stocker de manière sécurisée (pas sessionStorage!)

### MOYEN TERME (Jour 4-5)

**[RECOMMANDÉ] 7. Clarifier l'Architecture:** 
- [ ] Décider: SPA complète (HTML+JS côté client) OU MVC traditionnel (HTML généré par PHP)  
- [ ] Si SPA: le backend ne retourne que JSON de l'API REST
- [ ] Si MVC: le backend génère le HTML (pas besoin des vues JS)

**[RECOMMANDÉ] 8. Tester Complètement:**
- [ ] Tester création compte utilisateur (/gestion/ajouter)
- [ ] Tester scan étudiant (/scan/ajouter)
- [ ] Tester recherche étudiant (GET /search)
- [ ] Tester historique (/historical/{id})

---

## 🔐 PROBLÈMES DE SÉCURITÉ IDENTIFIÉS

### CRITIQUE

1. **Rôle Déterminé par le Frontend**
   - sessionController.js détermine le rôle en local (facilement contournable)
   - Doit être validé par le backend

2. **SessionStorage Non Sécurisé**
   - Les données de session peuvent être modifiées par JavaScript
   - Utiliser les sessions PHP ou JWT signé

3. **Insertion Directe de Paramètres**
   - Les modèles PHP ne valident pas les entrées
   - Risquer injection SQL (bien atténué par les prepared statements)
   - Ajouter validations

4. **Mots de Passe en Clair dans Test Data**
   - INSERT utilisateurs sortie_ecole.sql contient mots de passe en clair
   - Utiliser password_hash() (déjà fait en createUser mais pas dans data de test)

---

## 📊 STATISTIQUES

| Métrique | Valeur |
|----------|--------|
| Contrôleurs PHP implémentés | 1/7 (14%) |
| Contrôleurs PHP vides | 5/7 (71%) |
| Fichiers API JS correctement routés | 1/8 (12%) |
| Incohérences frontend-backend | 10+ |
| Routes exécutables | 1/5 en GET, 1/5 en POST |
| Taux de complétude du projet | ~15% |

---

## 🎯 PRIORITÉ D'ACTION

```
1. Corriger noms tables (BLOQUANT TOTAL)
   ↓
2. Corriger chemins PHP (BLOQUANT)
   ↓  
3. Unifier routes API (BLOQUANT)
   ↓
4. Implémenter contrôleurs vides
   ↓
5. Implémenter authentification
   ↓
6. Implémenter API centralisée JS
   ↓
7. Tests complets
```

---

## 📝 NOTES FINALES

**État du Projet:** 🔴 **NON FONCTIONNEL**

Le projet ne peut PAS fonctionner actuellement car:
- Les noms de tables ne correspondent pas
- Les chemins PHP sont incorrects
- Les routes API côté frontend pointent vers des fichiers inexistants
- Les contrôleurs ne sont pas implémentés
- L'authentification est simulée

**Temps Estimé de Correction:** 5-7 jours pour développeur senior

**Recommandation:** Corriger d'abord les 3 premiers blockers avant toute autre chose.


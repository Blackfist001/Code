# 🔒 AUDIT DE SÉCURITÉ COMPLET - École de Beauvoir

**Date :** 11 mai 2026  
**Périmètre :** Application PHP / API REST (réseau local)  
**Score global :** 3.5/10 🔴  

---

## 📊 MATRICE DE RISQUES

| Domaine | État | Risque | Priorité |
|---------|------|--------|----------|
| 🔴 **Données sensibles** | CRITIQUE | CRITIQUE | P0 |
| 🔴 **En-têtes sécurité** | ABSENT | CRITIQUE | P0 |
| 🔴 **Configuration affichage erreurs** | ACTIVÉ | CRITIQUE | P0 |
| 🟠 **Autorisation & contrôle accès** | PARTIEL | ÉLEVÉ | P1 |
| 🟠 **Validation entrées** | PARTIEL | MOYEN-ÉLEVÉ | P1 |
| 🟠 **Sessions** | PARTIEL | ÉLEVÉ | P1 |
| 🟡 **Debug logging** | ACTIF | ÉLEVÉ | P2 |
| ✅ **SQL Injection** | SÉCURISÉ | MOYEN | - |
| ✅ **Path Traversal** | SÉCURISÉ | BAS | - |
| ✅ **CSRF** | PARTIEL | BAS | P3 |

---

## 🔴 PRIORITÉ P0 - CRITIQUE (Corriger immédiatement)

### 1️⃣ **HARDCODED CREDENTIALS** - Vulnérabilité critique

**Fichiers affectés :**
- `app/config/config.php` → Credentials BD en clair
- `app/config/oauth_credentials.php` → Secrets SmartSchool OAuth
- `app/config/oneroster.php` → Secrets OneRoster
- `app/config/webService.php` → Credentials WebService Smartschool

**Risques :** 
- Accès BD non autorisé
- Accès aux APIs externes
- Compromission complète du système si config.php exposée

**Solution :**

```bash
# 1. Créer fichier .env (NE PAS COMMITTER)
# cp app/config/.env.example app/config/.env
```

**`app/config/.env` :**
```
DB_HOST=localhost
DB_NAME=sortie_ecole
DB_USER=root
DB_PASS=
SMARTSCHOOL_CLIENT_ID=...
SMARTSCHOOL_CLIENT_SECRET=eff9774f8334
ONEROSTER_CLIENT_SECRET=4777c801a1219845eaf9d7b454113ac0dc2c3472d3f031ca2d21d2e1c44e
SMARTSCHOOL_WS_LOGIN=jiEK-t*p.R7;MZ5
SMARTSCHOOL_PROFILE_PASSWORD=3debd4de2017ab608ac9
```

**`app/config/.env.example` (modèle à committer) :**
```
DB_HOST=localhost
DB_NAME=sortie_ecole
DB_USER=root
DB_PASS=
SMARTSCHOOL_CLIENT_ID=
SMARTSCHOOL_CLIENT_SECRET=
ONEROSTER_CLIENT_SECRET=
SMARTSCHOOL_WS_LOGIN=
SMARTSCHOOL_PROFILE_PASSWORD=
```

**`.gitignore` :**
```
# Secrets
app/config/.env
app/config/.env.local
app/logs/*
!app/logs/.gitkeep
vendor/
*.log
```

**Modifier `app/config/config.php` :**
```php
<?php
// Charger les variables d'environnement
require_once __DIR__ . '/../../vendor/autoload.php';

$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

return [
    'dsn' => sprintf(
        'mysql:host=%s;dbname=%s;port=3306;charset=utf8',
        $_ENV['DB_HOST'] ?? 'localhost',
        $_ENV['DB_NAME'] ?? 'sortie_ecole'
    ),
    'user' => $_ENV['DB_USER'] ?? 'root',
    'pass' => $_ENV['DB_PASS'] ?? '',
];
?>
```

**Installation :**
```bash
composer require vlucas/phpdotenv
```

**Risque résiduel :** Les secrets restent en mémoire à runtime (acceptable pour réseau local)

---

### 2️⃣ **ABSENCE D'EN-TÊTES DE SÉCURITÉ** - Configuration critique

**Fichier affecté :** `public/index.php`

**Risques :**
- XSS non mitigé
- Clickjacking possible
- Injection de contenu
- MITM si HTTP utilisé sur réseau

**Solution - Ajouter en début de `public/index.php` :**

```php
<?php
// ============================================
// SÉCURITÉ - En-têtes de sécurité obligatoires
// ============================================

// Prévention XSS
header('X-XSS-Protection: 1; mode=block');
header('X-Content-Type-Options: nosniff');

// Prévention clickjacking
header('X-Frame-Options: DENY');

// Politique de sécurité du contenu
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net qrserver.com; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' cdn.jsdelivr.net; frame-ancestors 'none'");

// Politique de référrer
header('Referrer-Policy: strict-origin-when-cross-origin');

// HSTS si HTTPS (activé si sur réseau sécurisé)
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// Permissions Policy
header("Permissions-Policy: geolocation=(), microphone=(), camera=(), usb=(), vr=()");

// Type contenu par défaut
header('Content-Type: text/html; charset=utf-8');

// ============================================
// FIN SÉCURITÉ
// ============================================
```

**Note :** Pour réseau local HTTP, les en-têtes HTTPS-only ne sont pas critiques mais recommandés.

---

### 3️⃣ **DISPLAY ERRORS ACTIVÉ** - Information Disclosure

**Fichier affecté :** `public/index.php`

**Risques :**
- Exposition paths serveur
- Détails BD exposés en cas erreur
- Versions PHP/extensions visibles

**Solution :**

```php
<?php
// Production (réseau local sécurisé)
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../app/logs/php-errors.log');

// Développement temporaire (à désactiver)
// ini_set('display_errors', '1');
```

---

## 🟠 PRIORITÉ P1 - ÉLEVÉ (Corriger très bientôt)

### 4️⃣ **AUTORISATION INCOMPLÈTE** - Contrôle d'accès insuffisant

**Fichiers affectés :**
- `app/controller/searchController.php` - Pas de vérification rôle
- `app/controller/studentsController.php` - Search sans contrôle
- `app/controller/ClassesController.php` - Delete sans vérification
- `app/controller/absenceController.php` - getTodayAbsents sans rôle

**Risques :**
- Surveillance peut modifier classes/horaires
- Accès transversal aux données
- Suppression non autorisée possible

**Solution - Pattern de vérification :**

```php
<?php
// Ajouter en début de chaque méthode sensible

private function requireRole(...$allowedRoles) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        throw new Exception('Non authentifié');
    }
    if (!in_array($_SESSION['role'] ?? null, $allowedRoles)) {
        http_response_code(403);
        throw new Exception('Accès refusé: rôle insuffisant');
    }
}

// Usage:
public function delete($params = []) {
    $this->requireRole('Gestionnaire');  // Seulement Gestionnaire
    // ... reste du code
}

public function search($params = []) {
    $this->requireRole('Gestionnaire', 'Surveillant');  // Gestionnaire OU Surveillant
    // ... reste du code
}
?>
```

**À appliquer dans :**
1. `classesController::delete()`
2. `classesController::update()`
3. `matieresController::delete()`
4. `usersController::*` (sauf verify/logout)
5. `studentsController::search()` (vérifier lecture seule)

---

### 5️⃣ **VALIDATION ENTRÉES INSUFFISANTE** - Injection risquée

**Fichiers affectés :**
- `searchController.php` L96-103 - Pas de validation `$_GET['q']`
- `absenceController.php` L79-91 - Format date non vérifié
- `scanController.php` L28 - UUID non validé
- `authController.php` L28-36 - Pas de limites length

**Risques :**
- Injection dans recherche
- Requêtes SQL malformées
- DoS par strings extrêmement longues

**Solution - Créer utilitaire `app/service/ValidationService.php` :**

```php
<?php
namespace App\Service;

class ValidationService {
    public static function validateString($value, $minLen = 0, $maxLen = 255) {
        if (!is_string($value)) return false;
        $len = mb_strlen($value);
        return $len >= $minLen && $len <= $maxLen;
    }

    public static function validateDate($date, $format = 'Y-m-d') {
        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function validateUUID($uuid) {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid) === 1;
    }

    public static function sanitizeSearch($query) {
        $q = trim($query);
        if (strlen($q) < 1 || strlen($q) > 100) {
            throw new \InvalidArgumentException('Recherche entre 1 et 100 caractères');
        }
        // Pas d'echappement PDO ici - sera fait par le modèle avec prepare()
        return $q;
    }
}
?>
```

**Usage dans `searchController.php` :**
```php
use App\Service\ValidationService;

public function search() {
    $q = ValidationService::sanitizeSearch($_GET['q'] ?? '');
    $results = $this->studentsModel->searchStudents(['search' => $q]);
}
```

---

### 6️⃣ **SESSIONS NON SÉCURISÉES** - Cookie insécurisé

**Fichier affecté :** `public/index.php`

**Risques :**
- Session hijacking
- Cookie accessible via JS (XSS)
- Pas de renouvellement de session

**Solution :**

```php
<?php
// Ajouter dans public/index.php avant session_start()

// Configuration session sécurisée
ini_set('session.cookie_httponly', '1');  // Pas d'accès JS
ini_set('session.cookie_samesite', 'Lax');  // Protection CSRF
if (!empty($_SERVER['HTTPS'])) {
    ini_set('session.cookie_secure', '1');  // HTTPS only
}
ini_set('session.gc_maxlifetime', '3600');  // 1 heure
ini_set('session.use_strict_mode', '1');

session_start();

// Renouveler l'ID après authentification
if (!isset($_SESSION['_session_started'])) {
    $_SESSION['_session_started'] = true;
} elseif (isset($_SESSION['user_id']) && !isset($_SESSION['_regenerated'])) {
    session_regenerate_id(true);
    $_SESSION['_regenerated'] = true;
}
?>
```

---

### 7️⃣ **DEBUG LOGGING DE DONNÉES SENSIBLES** - Fuite credentials

**Fichiers affectés :**
- `authController.php` L34 - Enregistre username + password
- `usersModel.php` L159 - Logs de password_verify

**Risques :**
- Fichiers logs lisibles par attaquants
- Credentials en clair dans historique logs

**Solution - Supprimer les logs sensibles :**

**`authController.php` :**
```php
// AVANT (DANGEREUX) :
error_log('Login input: ' . json_encode($input));  // SUPPRIMER!

// APRÈS (SÛRE) :
error_log('Login attempt for user');  // Sans data sensible
```

**`usersModel.php` :**
```php
// AVANT :
error_log('UsersModel password_verify: ' . ($valid ? 'true' : 'false'));

// APRÈS :
// Complètement supprimer ou :
error_log('Password verification: ' . ($valid ? 'success' : 'failed'));
```

---

## 🟡 PRIORITÉ P2 - MOYEN (Corriger dans les 2 semaines)

### 8️⃣ **PROTECTION CSRF RENFORCÉE** - Défense en profondeur

**État actuel :** Application JSON (moins vulnérable) mais pas de tokens

**Solution - Implémenter tokens CSRF :**

```php
<?php
// app/service/CsrfService.php
namespace App\Service;

class CsrfService {
    public static function generateToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verifyToken($token) {
        return isset($_SESSION['csrf_token']) && 
               hash_equals($_SESSION['csrf_token'], $token);
    }
}
?>
```

**Usage dans API :**
```php
<?php
// app/core/router.php - Ajouter pour POST/PUT/DELETE

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $headers = getallheaders();
    $token = $headers['X-CSRF-Token'] ?? $_POST['csrf_token'] ?? null;
    
    if (!CsrfService::verifyToken($token)) {
        http_response_code(403);
        die(json_encode(['error' => 'Token CSRF invalide']));
    }
}
?>
```

**JavaScript client :**
```javascript
// public/js/api.js - Wrapper fetch

async function apiCall(method, endpoint, data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Ajouter token CSRF pour POST/PUT/DELETE
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        headers['X-CSRF-Token'] = document.querySelector('meta[name="csrf-token"]')?.content;
    }
    
    return fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
    });
}
```

---

## ✅ POINTS POSITIFS - À maintenir

### ✓ SQL Injection protégée
- ✅ Utilisation systématique de `prepare()` et `execute()`
- ✅ Tables/colonnes contrôlées via whitelist interne
- **Conseil :** Continuer cette pratique pour tout nouveau code

### ✓ Path Traversal protégé
- ✅ Aucun traitement de upload utilisateur
- ✅ Fichiers config hors du web root
- **Conseil :** Garder cette architecture

### ✓ Password hashing sécurisé
- ✅ Utilisation de `password_hash()` (PASSWORD_DEFAULT = bcrypt)
- ✅ Vérification via `password_verify()`
- **Conseil :** Maintenir le standard

---

## 📋 CHECKLIST DE REMÉDIATION

### Phase 1 - CRITIQUE (cette semaine)
- [ ] Implémenter .env avec vlucas/phpdotenv
- [ ] Retirer hardcoded credentials de tous les config*.php
- [ ] Ajouter en-têtes de sécurité (CSP, X-Frame-Options, etc.)
- [ ] Désactiver display_errors
- [ ] Ajouter requireRole() dans Controllers sensibles
- [ ] Tester accès suite aux changements

### Phase 2 - ÉLEVÉ (2 semaines)
- [ ] Implémenter ValidationService
- [ ] Valider toutes les entrées utilisateur
- [ ] Sécuriser session.cookie_*
- [ ] Supprimer tous les debug logs sensibles
- [ ] Tests de régression complets

### Phase 3 - MOYEN (1 mois)
- [ ] Implémenter tokens CSRF
- [ ] Ajouter rate limiting sur login
- [ ] Logger les tentatives d'accès refusé
- [ ] Audit de données d'ownership (qui peut voir/modifier quoi)

---

## 🧪 TESTS DE SÉCURITÉ À EFFECTUER

### Test 1 : Vérifier autorisation
```bash
# Essayer d'accéder à /api/users avec rôle Surveillant
curl -H "X-User-Role: Surveillant" http://127.0.0.1:8000/api/users
# Doit retourner 403
```

### Test 2 : Vérifier en-têtes
```bash
curl -I http://127.0.0.1:8000/
# Vérifier présence X-Frame-Options, Content-Security-Policy
```

### Test 3 : Vérifier config exposure
```bash
curl http://127.0.0.1:8000/app/config/config.php
# Doit retourner 404 ou PHP non exécuté
```

### Test 4 : XSS basique
```bash
curl "http://127.0.0.1:8000/api/search?q=<script>alert(1)</script>"
# Doit être échappé ou rejeté
```

---

## 📞 CONTACTS & ESCALADE

Pour réseau local sécurisé :
- **P0** (Critique) : À corriger avant toute mise en production
- **P1** (Élevé) : À corriger avant accès réseau
- **P2** (Moyen) : À corriger pour conformité standard

---

## 📚 RÉFÉRENCES

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet - PHP](https://cheatsheetseries.owasp.org/)
- [CWE-200: Information Exposure](https://cwe.mitre.org/data/definitions/200.html)
- [PHP Security Best Practices](https://www.php.net/manual/en/security.php)

---

**Audit réalisé le :** 11 mai 2026  
**Niveau de confidentialité :** Interne  
**Durée de validité :** 3 mois (réévaluation recommandée)

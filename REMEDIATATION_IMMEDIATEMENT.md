# 🚀 PLAN D'ACTION IMMÉDIAT - Remédiation Sécurité

**Objectif :** Corriger les vulnérabilités CRITIQUES (P0) en < 1 jour  
**Réseau :** Local (moins critique mais recommandé)

---

## ⚡ ÉTAPE 1 : Protéger les secrets (5 min)

### 1.1 Installer dotenv

```bash
cd c:\ProgsCodes\#ECI\Stage\test\Code
composer require vlucas/phpdotenv
```

### 1.2 Créer `.env.example` (à committer)

```bash
# Créer dans app/config/.env.example
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

### 1.3 Créer `.env` (NE PAS COMMITTER)

```bash
# Créer dans app/config/.env avec les vraies valeurs
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

### 1.4 Mettre à jour `.gitignore`

Ajouter :
```
# Environment
app/config/.env
app/config/.env.local
.env.*.php

# Logs
app/logs/*
!app/logs/.gitkeep

# Vendor
vendor/
```

---

## ⚡ ÉTAPE 2 : Charger les secrets (app/config/config.php)

```php
<?php
// Configuration de la base de données
// Charge les variables d'environnement depuis .env

require_once __DIR__ . '/../../vendor/autoload.php';

// Charger le fichier .env s'il existe
$envPath = __DIR__ . '/../../app/config/.env';
if (file_exists($envPath)) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../app/config');
    $dotenv->load();
}

// Configuration BD
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

---

## ⚡ ÉTAPE 3 : Accéder aux secrets dans OAuth/OneRoster

**Modifier `app/config/oauth_credentials.php` :**

```php
<?php
require_once __DIR__ . '/../../vendor/autoload.php';

$envPath = __DIR__ . '/../../app/config/.env';
if (file_exists($envPath)) {
    Dotenv\Dotenv::createImmutable(__DIR__ . '/../../app/config')->load();
}

return [
    'oauth_client_id' => $_ENV['SMARTSCHOOL_CLIENT_ID'] ?? '',
    'oauth_client_secret' => $_ENV['SMARTSCHOOL_CLIENT_SECRET'] ?? '',
];
?>
```

**Modifier `app/config/oneroster.php` :**

```php
<?php
require_once __DIR__ . '/../../vendor/autoload.php';

$envPath = __DIR__ . '/../../app/config/.env';
if (file_exists($envPath)) {
    Dotenv\Dotenv::createImmutable(__DIR__ . '/../../app/config')->load();
}

return [
    'client_id' => '....',
    'client_secret' => $_ENV['ONEROSTER_CLIENT_SECRET'] ?? '',
];
?>
```

**Modifier `app/config/webService.php` :**

```php
<?php
require_once __DIR__ . '/../../vendor/autoload.php';

$envPath = __DIR__ . '/../../app/config/.env';
if (file_exists($envPath)) {
    Dotenv\Dotenv::createImmutable(__DIR__ . '/../../app/config')->load();
}

return [
    'smartschool' => [
        'soap_url' => '...',
        'login' => $_ENV['SMARTSCHOOL_WS_LOGIN'] ?? '',
        'password' => '...',
        'profile_password' => $_ENV['SMARTSCHOOL_PROFILE_PASSWORD'] ?? '',
    ]
];
?>
```

---

## ⚡ ÉTAPE 4 : Ajouter en-têtes de sécurité (public/index.php)

**Insérer au tout début du fichier, avant tout autre code :**

```php
<?php
// ============================================
// SÉCURITÉ - EN-TÊTES OBLIGATOIRES
// ============================================

// Type de contenu
header('Content-Type: text/html; charset=utf-8');

// Prévention XSS
header('X-XSS-Protection: 1; mode=block');

// Prévention MIME-type sniffing
header('X-Content-Type-Options: nosniff');

// Prévention clickjacking
header('X-Frame-Options: DENY');

// Content Security Policy (restrictif)
$csp = "default-src 'self'; " .
       "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net qrserver.com; " .
       "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; " .
       "img-src 'self' data: https:; " .
       "font-src 'self' cdn.jsdelivr.net; " .
       "connect-src 'self'; " .
       "frame-ancestors 'none'; " .
       "base-uri 'self'; " .
       "form-action 'self'";
header("Content-Security-Policy: $csp");

// Politique de référrer
header('Referrer-Policy: strict-origin-when-cross-origin');

// HSTS pour HTTPS (optionnel pour réseau local HTTP)
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// Permissions Policy
header("Permissions-Policy: geolocation=(), microphone=(), camera=(), usb=(), vr=()");

// ============================================
// FIN SÉCURITÉ
// ============================================

// Session configuration
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', '1');
}
ini_set('session.gc_maxlifetime', '3600');
ini_set('session.use_strict_mode', '1');

// Error handling
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../app/logs/php-errors.log');

// Rest of existing code...
?>
```

---

## ⚡ ÉTAPE 5 : Supprimer les logs sensibles

**Dans `app/controller/authController.php`, supprimer ou commenter :**

```php
// AVANT (DANGEREUX) :
error_log('Login input: ' . json_encode($input));

// APRÈS (SÛRE) :
// Complètement supprimé
```

**Dans `app/model/usersModel.php`, supprimer ou remplacer :**

```php
// AVANT :
error_log('UsersModel password_verify: ' . ($valid ? 'true' : 'false'));

// APRÈS (optionnel) :
// error_log('Password verification attempt completed');
```

---

## ⚡ ÉTAPE 6 : Ajouter contrôle d'autorisation (Pattern)

**Créer `app/service/AuthService.php` :**

```php
<?php
namespace App\Service;

class AuthService {
    /**
     * Vérifier l'authentification
     */
    public static function requireAuth() {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            throw new \Exception('Non authentifié - Veuillez vous connecter');
        }
    }

    /**
     * Vérifier le rôle (une ou plusieurs valeurs acceptées)
     */
    public static function requireRole(...$allowedRoles) {
        self::requireAuth();
        
        $userRole = $_SESSION['role'] ?? null;
        if (!in_array($userRole, $allowedRoles, true)) {
            http_response_code(403);
            throw new \Exception('Accès refusé - Rôle insuffisant: ' . $userRole);
        }
    }

    /**
     * Vérifier si l'utilisateur est Gestionnaire
     */
    public static function isAdmin() {
        return ($_SESSION['role'] ?? null) === 'Gestionnaire';
    }

    /**
     * Vérifier si l'utilisateur est Surveillant
     */
    public static function isSurveillant() {
        return ($_SESSION['role'] ?? null) === 'Surveillant';
    }

    /**
     * Obtenir l'ID utilisateur courant
     */
    public static function getCurrentUserId() {
        self::requireAuth();
        return $_SESSION['user_id'];
    }

    /**
     * Obtenir le rôle courant
     */
    public static function getCurrentRole() {
        return $_SESSION['role'] ?? null;
    }
}
?>
```

**Utilisation dans `ClassesController::delete()` :**

```php
<?php
// Dans classesController.php

use App\Service\AuthService;

public function delete($params = []) {
    try {
        AuthService::requireRole('Gestionnaire');  // Seulement Gestionnaire
        
        $id = $params['id'] ?? null;
        if (!$id) {
            // Retourner erreur
        }
        
        $success = $this->classesModel->deleteClass($id);
        // Rest of code...
    } catch (\Exception $e) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
```

**À appliquer dans ces contrôleurs (méthodes) :**

| Contrôleur | Méthode | Rôle autorisé |
|-----------|---------|---------------|
| classesController | delete, update | Gestionnaire |
| classesController | list, get | Tous |
| matieresController | delete, update | Gestionnaire |
| usersController | add, update, delete, list | Gestionnaire |
| studentsController | add, update, delete | Gestionnaire |
| schedulesController | add, update, delete | Gestionnaire |

---

## ✅ CHECKLIST IMMÉDIATE

```
Étape 1 - Secrets (.env)
[ ] Installer dotenv : composer require vlucas/phpdotenv
[ ] Créer app/config/.env.example
[ ] Créer app/config/.env avec vraies valeurs
[ ] Mettre à jour .gitignore

Étape 2 - Configuration
[ ] Modifier app/config/config.php
[ ] Modifier app/config/oauth_credentials.php
[ ] Modifier app/config/oneroster.php
[ ] Modifier app/config/webService.php

Étape 3 - Sécurité headers
[ ] Ajouter headers de sécurité dans public/index.php
[ ] Configurer session securement
[ ] Désactiver display_errors

Étape 4 - Logs
[ ] Supprimer error_log avec credentials dans authController.php
[ ] Supprimer error_log avec credentials dans usersModel.php

Étape 5 - Autorisation (optionnel dans l'immédiat)
[ ] Créer app/service/AuthService.php
[ ] Ajouter requireRole() dans classesController::delete()
[ ] Tester accès

Étape 6 - Test
[ ] Tester login (doit fonctionner)
[ ] Tester vérifier en-têtes : curl -I http://127.0.0.1:8000/
[ ] Vérifier logs (pas de credentials)
[ ] Test d'accès refusé
```

---

## 🧪 VALIDATION APRÈS REMÉDIATION

### Test 1 : Vérifier secrets pas exposés

```bash
curl http://127.0.0.1:8000/app/config/config.php
# Doit retourner 404 ou PHP non exécuté
```

### Test 2 : Vérifier en-têtes présents

```bash
curl -I http://127.0.0.1:8000/
# Vérifier présence :
# X-Frame-Options: DENY
# Content-Security-Policy: ...
# X-Content-Type-Options: nosniff
```

### Test 3 : Vérifier logs propres

```bash
# Consulter app/logs/php-errors.log
tail -f app/logs/php-errors.log
# Doit être vide ou sans data sensible
```

### Test 4 : Vérifier authentification

```bash
# Sans session, doit retourner 401
curl http://127.0.0.1:8000/api/users
# {"success":false,"message":"Non authentifié"}
```

### Test 5 : Vérifier fonctionnalité après changements

```bash
# Test login (doit marcher)
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
# {"success":true,"message":"Authentification réussie",...}
```

---

## ⚠️ POINTS D'ATTENTION

1. **Dotenv et autoload** : S'assurer que composer autoload.php est inclus
2. **Permissions fichiers** : `.env` doit avoir des permissions 600 (non lisible par autres)
3. **Logs rotation** : Mettre en place rotation logs pour éviter saturation disque
4. **Backup .env** : Garder backup sécurisé du .env en cas de régénération

---

**Temps total d'implémentation :** ~2 heures  
**Priorité :** CRITIQUE - À faire AVANT toute mise en production

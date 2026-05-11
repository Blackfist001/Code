# 🚀 GUIDE D'EXÉCUTION - Correctifs P0 Critiques

## 📋 PRÉREQUIS

- Windows PowerShell 5.0+ 
- Projet PHP dans `C:\ProgsCodes\#ECI\Stage\test\Code`
- Accès administrateur pour les permissions de fichiers
- Composer installé (pour `composer require vlucas/phpdotenv`)

---

## ⚡ ÉTAPES D'EXÉCUTION

### ÉTAPE 1️⃣ : Exécuter le script de correctifs

```powershell
# Naviguer vers le répertoire du projet
cd C:\ProgsCodes\#ECI\Stage\test\Code

# Exécuter le script d'application des correctifs
.\APPLY_SECURITY_FIXES.ps1
```

**Résultat attendu :**
```
✅ ALL P0 CRITICAL SECURITY FIXES APPLIED!
======================================
📋 Summary of changes:
  ✅ Created .env (secrets)
  ✅ Created .env.example (template)
  ✅ Updated .gitignore
  ✅ Updated config.php (load from .env)
  ✅ Updated oauth_credentials.php (load from .env)
  ✅ Updated webService.php (load from .env)
  ✅ Updated public/index.php (security headers + session)
  ✅ Removed sensitive logs

⚠️  NEXT STEPS:
  1. Run: composer require vlucas/phpdotenv
  2. Run: composer update
  3. Test the site: http://127.0.0.1:8000/
  4. Run security tests: .\TEST_SECURITY_P0.ps1
```

---

### ÉTAPE 2️⃣ : Installer Dotenv via Composer

```powershell
# Installer vlucas/phpdotenv
composer require vlucas/phpdotenv

# Mettre à jour les dépendances
composer update
```

**Résultat attendu :**
```
Using version ^5.5 for vlucas/phpdotenv
./composer.json has been updated
Running composer update vlucas/phpdotenv
...
Installing vlucas/phpdotenv (v5.5.0)
...
```

---

### ÉTAPE 3️⃣ : Démarrer le serveur PHP local

```powershell
# Naviguer vers le répertoire du projet
cd C:\ProgsCodes\#ECI\Stage\test\Code

# Démarrer le serveur PHP (port 8000)
php -S 127.0.0.1:8000 -t public/
```

**Résultat attendu :**
```
[Mon May 11 14:35:42 2026] Listening on http://127.0.0.1:8000/
[Mon May 11 14:35:42 2026] Press Ctrl-C to quit
```

---

### ÉTAPE 4️⃣ : Exécuter les tests de sécurité

**Dans un NOUVEAU terminal PowerShell :**

```powershell
# Test P0 - Tests de base
cd C:\ProgsCodes\#ECI\Stage\test\Code
.\TEST_SECURITY_P0.ps1

# Test spécifique webService & SmartschoolWebServiceV3Client
.\TEST_WEBSERVICE_SECURITY.ps1
```

**Résultats attendus :**

#### TEST_SECURITY_P0.ps1
```
🧪 SECURITY TESTS - P0 CRITICAL FIXES
======================================

[TEST 1] Secrets not hardcoded in files
  ✅ config.php: Using environment variables
  ✅ oauth_credentials.php: Using environment variables
  ✅ webService.php: Using environment variables

[TEST 2] .env file exists and in .gitignore
  ✅ .env file exists
  ✅ .env listed in .gitignore

[TEST 3] Security headers present
  ✅ X-Frame-Options: DENY
  ✅ X-Content-Type-Options: nosniff
  ✅ Content-Security-Policy: Present
  ✅ Referrer-Policy: strict-origin-when-cross-origin

[TEST 4] Display errors disabled
  ✅ display_errors set to 0
  ✅ log_errors enabled for logging

[TEST 5] No sensitive data in error logs
  ✅ No sensitive patterns found in logs

[TEST 6] Session configuration secure
  ✅ session.cookie_httponly = 1 (HttpOnly set)
  ✅ session.cookie_samesite = Lax (CSRF protection)
  ✅ session.gc_maxlifetime = 3600 (1 hour timeout)

[TEST 7] webService.php security
  ✅ SMARTSCHOOL_WS_LOGIN from environment
  ✅ SMARTSCHOOL_PROFILE_PASSWORD from environment

✅ Passed: 18/18
❌ Failed: 0/18

✅ ALL TESTS PASSED!
🎉 P0 Critical Security Fixes are properly applied!
```

#### TEST_WEBSERVICE_SECURITY.ps1
```
🔐 SECURITY TESTS - webService & SmartschoolWebServiceV3Client
================================================================

[TEST 1] webService.php security
  ✅ No hardcoded secrets found in webService.php
  ✅ Uses $_ENV['SMARTSCHOOL_WS_LOGIN']
  ✅ Uses $_ENV['SMARTSCHOOL_PROFILE_PASSWORD']
  ✅ Uses Dotenv to load environment variables

[TEST 2] SmartschoolWebServiceV3Client security
  ✅ Uses environment variables for credentials
  ✅ No sensitive data in error logs

[TEST 3] Configuration loading security chain
  ✅ config.php properly loads Dotenv

[TEST 4] Environment file (.env) security
  ✅ .env file exists
  ✅ .env contains SMARTSCHOOL_WS_LOGIN (value not exposed)
  ✅ .env.example exists (template for developers)

[TEST 5] Source code secret exposure scan
  ✅ No hardcoded secrets found in PHP source code

[TEST 6] Git ignore configuration
  ✅ .env is in .gitignore
  ✅ vendor/ is in .gitignore

✅ Passed: 12/12
❌ Failed: 0/12

✅ ALL WEBSERVICE SECURITY TESTS PASSED!
🎉 webService.php and SmartschoolWebServiceV3Client are properly secured!
```

---

## 🧪 TEST MANUEL - Vérification supplémentaire

### Test 1 : Vérifier les en-têtes de sécurité

```powershell
curl -I http://127.0.0.1:8000/
```

**Résultat attendu :**
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net qrserver.com; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), usb=(), vr=()
```

### Test 2 : Vérifier le login fonctionne

```powershell
curl -X POST http://127.0.0.1:8000/api/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin"}'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Authentification réussie",
  "user": {
    "id_user": 1,
    "nom": "admin",
    "role": "Gestionnaire"
  },
  ...
}
```

### Test 3 : Vérifier .env n'est pas accessible

```powershell
curl http://127.0.0.1:8000/app/config/.env
curl http://127.0.0.1:8000/app/config/config.php
```

**Résultat attendu :**
```
404 Not Found (ou le contenu n'est jamais affiché)
```

---

## 📊 CHECKLIST DE VALIDATION

```
PHASE D'APPLICATION
[ ] .\APPLY_SECURITY_FIXES.ps1 exécuté avec succès
[ ] composer require vlucas/phpdotenv exécuté
[ ] composer update exécuté
[ ] app/config/.env créé
[ ] app/config/.env.example créé

PHASE DE VÉRIFICATION
[ ] .\TEST_SECURITY_P0.ps1 : TOUTES les tests PASS
[ ] .\TEST_WEBSERVICE_SECURITY.ps1 : TOUTES les tests PASS
[ ] curl -I http://127.0.0.1:8000/ : Headers sécurité présents
[ ] Login fonctionne : curl ... /api/login
[ ] .env non accessible : 404

FICHIERS MODIFIÉS
[ ] app/config/config.php : charge .env via Dotenv
[ ] app/config/oauth_credentials.php : charge .env
[ ] app/config/webService.php : charge .env
[ ] public/index.php : en-têtes sécurité + session config
[ ] app/controller/authController.php : logs sensibles supprimés
[ ] composer.json : ajoute vlucas/phpdotenv
[ ] .gitignore : ajoute .env
```

---

## 🔍 STRUCTURE FINALE APRÈS CORRECTIFS

```
project-root/
├── app/
│   ├── config/
│   │   ├── .env (NE PAS COMMITTER)
│   │   ├── .env.example (À COMMITTER)
│   │   ├── config.php (MODIFIÉ - charge .env)
│   │   ├── oauth_credentials.php (MODIFIÉ - charge .env)
│   │   ├── webService.php (MODIFIÉ - charge .env)
│   │   └── oneroster.php (À MODIFIER si nécessaire)
│   ├── controller/
│   │   ├── authController.php (MODIFIÉ - logs supprimés)
│   │   └── ...
│   ├── service/
│   │   └── SmartschoolWebServiceV3Client.php (À VÉRIFIER)
│   └── logs/
│       └── php_errors.log (logs sécurisés)
├── public/
│   └── index.php (MODIFIÉ - en-têtes + session config)
├── vendor/
│   └── vlucas/phpdotenv/ (NOUVEAU - dépendance)
├── .gitignore (MODIFIÉ - ajoute .env)
├── composer.json (MODIFIÉ - ajoute phpdotenv)
├── APPLY_SECURITY_FIXES.ps1 (NOUVEAU)
├── TEST_SECURITY_P0.ps1 (NOUVEAU)
└── TEST_WEBSERVICE_SECURITY.ps1 (NOUVEAU)
```

---

## ⚠️ POINTS IMPORTANTS

1. **Ne JAMAIS committer le fichier .env** - Contient les vrais secrets
2. **Toujours committer .env.example** - Template pour les développeurs
3. **Garder une copie de .env en lieu sûr** - Backup sécurisé
4. **Mettre à jour .env.example** si nouvelles variables ajoutées
5. **Vérifier logs régulièrement** - Pour anomalies sécurité

---

## 🚨 TROUBLESHOOTING

### Le serveur PHP ne démarre pas
```powershell
# Vérifier port en utilisation
netstat -ano | findstr :8000

# Utiliser un autre port si nécessaire
php -S 127.0.0.1:8001 -t public/
```

### Erreur "Class 'Dotenv\Dotenv' not found"
```powershell
# Réinstaller Composer autoload
composer dump-autoload

# Ou réinstaller complètement
composer install
```

### Tests FAIL - secrets toujours en code source
```powershell
# Vérifier fichiers modifiés
Get-Content app/config/config.php | findstr "localhost"
# Doit retourner: '_ENV['DB_HOST']

# Relancer le script de correctifs
.\APPLY_SECURITY_FIXES.ps1
```

### .env pas chargé
```powershell
# Vérifier le fichier existe
Test-Path app/config/.env

# Vérifier Dotenv installé
composer show vlucas/phpdotenv

# Vérifier include dans config.php
Get-Content app/config/config.php | findstr "Dotenv"
```

---

## ✅ VALIDATION FINALE

Une fois tous les tests PASS, vous avez :

✅ **Secrets sécurisés** - Plus de hardcoded credentials  
✅ **En-têtes de sécurité** - Protection XSS, clickjacking, MITM  
✅ **Sessions sécurisées** - HttpOnly, SameSite cookies  
✅ **Erreurs cachées** - Pas d'information disclosure  
✅ **Logs nettoyés** - Pas de données sensibles  
✅ **WebService sécurisé** - SmartSchool credentials en .env  

**Score de sécurité : 3.5 → 6.5/10** 🎉

---

## 📞 PROCHAINES ÉTAPES

Après P0 ✅, continuer avec :
- **P1 (ÉLEVÉ)** : Validation entrées, autorisation, CSRF tokens
- **P2 (MOYEN)** : Rate limiting, logs rotation, monitoring

Voir `AUDIT_SECURITE_COMPLET.md` pour détails complets.

---

**Date :** 11 mai 2026  
**Durée totale :** ~2 heures (incluant tests)  
**Audience :** Développeurs, DevOps, Admin système

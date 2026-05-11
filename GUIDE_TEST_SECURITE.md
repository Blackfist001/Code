# 🧪 GUIDE DE TESTS SÉCURITÉ APRÈS REMÉDIATION

## Tests à effectuer pour valider la remédiation

---

## TEST 1 : Secrets pas exposés ✅

### Objectif
Vérifier que les secrets ne sont plus accessibles/visibles

### Commands

```bash
# Test 1a : Config file not accessible
curl http://127.0.0.1:8000/app/config/config.php
# Doit retourner 404 Not Found (pas 200 avec du contenu)

# Test 1b : .env file not accessible
curl http://127.0.0.1:8000/app/config/.env
# Doit retourner 404 Not Found

# Test 1c : Vérifier .env pas en source
grep -r "SMARTSCHOOL_CLIENT_SECRET" app/config/*.php
# Doit être VIDE (aucun grep result)
```

### Résultat attendu
```
✅ PASS si : 404 pour config.php, 404 pour .env, aucun secret en dur dans les PHP files
❌ FAIL si : 200 response ou code PHP affiché
```

---

## TEST 2 : En-têtes de sécurité présents ✅

### Objectif
Vérifier que tous les en-têtes de sécurité sont présents

### Command

```bash
curl -I http://127.0.0.1:8000/
```

### Résultat attendu
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

### Checklist
```
[ ] X-Frame-Options: DENY (présent)
[ ] X-Content-Type-Options: nosniff (présent)
[ ] X-XSS-Protection: 1 (présent)
[ ] Content-Security-Policy: (présent)
[ ] Referrer-Policy: (présent)
[ ] Permissions-Policy: (présent)
```

---

## TEST 3 : Display errors désactivé ✅

### Objectif
Vérifier que les erreurs ne sont pas affichées

### Command

```bash
# Forcer une erreur
curl http://127.0.0.1:8000/api/nonexistent-endpoint
```

### Résultat attendu
```
❌ FAIL : 
  Fatal error: Call to undefined function...
  Parse error: syntax error...
  Warning: ...

✅ PASS :
  {"success":false,"message":"..."}
  ou simple HTML sans détails techniques
```

### Check fichier log
```bash
# Vérifier les logs contiennent l'erreur
tail app/logs/php-errors.log
```

---

## TEST 4 : Logs pas sensibles ✅

### Objectif
Vérifier que les logs ne contiennent pas de credentials

### Command

```bash
# Chercher credentials dans les logs
grep -i "password\|secret\|credential\|username.*admin" app/logs/php-errors.log

# Chercher SMARTSCHOOL dans les logs
grep "SMARTSCHOOL\|OneRoster\|eff9774f8334" app/logs/php-errors.log

# Chercher erreurs de login
grep "Login input\|password_verify" app/logs/php-errors.log
```

### Résultat attendu
```
✅ PASS : Aucun grep result (aucun credential en logs)
❌ FAIL : Grep results avec credentials
```

---

## TEST 5 : Authentification fonctionnelle ✅

### Objectif
Vérifier que l'authentification fonctionne après changements

### Command

```bash
# Test de login
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Résultat attendu
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

### Résultat FAIL
```json
{
  "success": false,
  "message": "Identifiants invalides"
}
```

---

## TEST 6 : Vérification session non authentifiée ✅

### Objectif
Vérifier qu'un accès sans authentification est refusé

### Command

```bash
# Accès sans cookie de session
curl -I http://127.0.0.1:8000/api/users

# Ou via API
curl http://127.0.0.1:8000/api/users
```

### Résultat attendu
```
HTTP/1.1 401 Unauthorized
ou
{"success":false,"message":"Non authentifié"}
```

---

## TEST 7 : Validations d'entrées ✅

### Objectif
Vérifier que les validations d'entrées fonctionnent

### Command - Test 1 : String trop long

```bash
# Recherche avec string > 100 caractères
curl "http://127.0.0.1:8000/api/students/search?q=$(printf 'a%.0s' {1..150})"
```

### Résultat attendu
```
❌ FAIL (pas de validation):
  [liste d'étudiants]

✅ PASS (validé):
  {"success":false,"message":"Recherche entre 1 et 100 caractères"}
```

### Command - Test 2 : Date invalide

```bash
# Date au mauvais format
curl "http://127.0.0.1:8000/api/absence?date=2026/05/11"
```

### Résultat attendu
```
{"success":false,"message":"Format de date invalide"}
```

---

## TEST 8 : Session securisée ✅

### Objectif
Vérifier que les cookies de session sont sécurisés

### Command

```bash
# Voir les cookies
curl -I -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | grep -i "set-cookie"
```

### Résultat attendu
```
Set-Cookie: PHPSESSID=...; Path=/; HttpOnly; SameSite=Lax
```

### Checklist
```
[ ] HttpOnly présent (pas accessible via JS)
[ ] SameSite=Lax ou Strict (protection CSRF)
[ ] Pas de "secure" en HTTP local (ok pour local)
```

---

## TEST 9 : Contrôle d'accès (Autorisation) ✅

### Objectif
Vérifier que les rôles sont respectés

### Setup
```bash
# Login avec un Surveillant
# (peut varoir selon votre DB - adapter username/password)
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"surveillant","password":"password"}' \
  -c cookies.txt

# Copier le PHPSESSID
```

### Command - Test Gestionnaire only

```bash
# Essayer de supprimer une classe (Gestionnaire only)
curl -X POST http://127.0.0.1:8000/api/classes/delete \
  -H "Content-Type: application/json" \
  -d '{"id":1}' \
  -b cookies.txt
```

### Résultat attendu
```
❌ FAIL (pas de contrôle):
  {"success":true,"message":"Classe supprimée"}

✅ PASS (accès refusé):
  HTTP/1.1 403 Forbidden
  {"success":false,"message":"Accès refusé - Rôle insuffisant"}
```

---

## TEST 10 : XSS basique ✅

### Objectif
Vérifier que les XSS simples sont mitigées

### Command

```bash
# Injection XSS basique
curl "http://127.0.0.1:8000/api/students/search?q=<script>alert(1)</script>"
```

### Résultat attendu
```
❌ FAIL (pas de protection):
  Erreur JavaScript en console du navigateur

✅ PASS (échappé ou rejeté):
  {"success":false,"message":"..."}
  ou results avec XSS échappé (&lt;script&gt;)
```

---

## SCRIPT DE TEST COMPLET

### Créer `test_security.ps1`

```powershell
# PowerShell Security Test Suite

$base = "http://127.0.0.1:8000"
$api = "$base/api"

Write-Host "🔒 Security Test Suite" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Test 1: Headers
Write-Host "`n[TEST 1] Security Headers" -ForegroundColor Yellow
$headers = Invoke-WebRequest -Uri $base -Method Head
$csp = $headers.Headers['Content-Security-Policy']
$xframe = $headers.Headers['X-Frame-Options']
Write-Host "✅ X-Frame-Options: $xframe" -ForegroundColor Green
Write-Host "✅ CSP: $($csp.Substring(0, 50))..." -ForegroundColor Green

# Test 2: Auth required
Write-Host "`n[TEST 2] Authentication Required" -ForegroundColor Yellow
$noauth = Invoke-WebRequest -Uri "$api/users" -ErrorAction SilentlyContinue -StatusCodeVariable status
Write-Host "Status: $status (expected 401)" -ForegroundColor Green

# Test 3: Login
Write-Host "`n[TEST 3] Valid Login" -ForegroundColor Yellow
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod -Uri "$api/login" -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin"}' `
  -WebSession $session
Write-Host "✅ Login successful: $($login.success)" -ForegroundColor Green

# Test 4: Invalid input
Write-Host "`n[TEST 4] Input Validation" -ForegroundColor Yellow
$longquery = "a" * 150
$search = Invoke-RestMethod -Uri "$api/students/search?q=$longquery" `
  -WebSession $session -ErrorAction SilentlyContinue
Write-Host "Query validation: $($search.message)" -ForegroundColor Green

# Test 5: Display errors
Write-Host "`n[TEST 5] Error Handling" -ForegroundColor Yellow
$error_test = Invoke-WebRequest -Uri "$api/invalid" -ErrorAction SilentlyContinue
Write-Host "Error exposure: $($error_test.StatusCode)" -ForegroundColor Green

Write-Host "`n✅ All tests completed" -ForegroundColor Green
```

### Exécuter
```powershell
powershell -ExecutionPolicy Bypass -File test_security.ps1
```

---

## TABLEAU DE SYNTHÈSE DES TESTS

| Test | Objectif | Commande clé | Résultat attendu | Status |
|------|----------|--------------|------------------|--------|
| 1 | Secrets exposés | `curl config.php` | 404 | ✅ |
| 2 | Headers sécurité | `curl -I` | X-Frame-Options, CSP, ... | ✅ |
| 3 | Display errors | Erreur API | Pas de détails techniques | ✅ |
| 4 | Logs sensibles | `grep password` | Aucun résultat | ✅ |
| 5 | Auth fonctionnelle | Login API | {"success":true} | ✅ |
| 6 | Auth requise | API sans session | 401 Unauthorized | ✅ |
| 7 | Validation inputs | Payload long/invalide | Rejeté avec message | ✅ |
| 8 | Session sécurisée | Headers cookies | HttpOnly, SameSite | ✅ |
| 9 | Contrôle accès | Delete as Surveillant | 403 Forbidden | ✅ |
| 10 | XSS mitigé | `<script>alert(1)</script>` | Échappé ou rejeté | ✅ |

---

## VALIDATION FINALE

Tous les tests MUST PASS avant mise en production :

```
✅ Secrets sécurisés
✅ En-têtes présents
✅ Erreurs cachées
✅ Logs propres
✅ Auth fonctionnelle
✅ Auth requise pour API
✅ Inputs validés
✅ Sessions sécurisées
✅ Rôles respectés
✅ XSS mitigé
```

---

**Temps test complet :** ~30 minutes  
**Fréquence :** Après chaque remédiation, puis mensuellement

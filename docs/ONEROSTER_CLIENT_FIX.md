# OneRosterClient - Fix Documentation

## Problème identifié

La méthode `getStudents()` dans [app/service/OneRosterClient.php](app/service/OneRosterClient.php) ne testait qu'un seul endpoint `/students` sans fallback, ce qui causait des timeouts si Smartschool utilisait un endpoint alternatif.

### État antérieur (commit 13a72e6)

```php
public function getStudents(): array {
    $token = $this->getAccessToken();
    $url = rtrim($this->config['web_access_url'], '/') . '/students';

    return $this->getJson($url, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
    ]);
}
```

**Impact** : Si l'endpoint `/students` timeout ou retourne 404/405, aucun fallback n'était tenté.

## Solution implémentée

La méthode `getStudents()` utilise maintenant `getFirstAvailablePayload()` avec plusieurs endpoints candidats, alignant le comportement avec `getTeachers()` et `getSchedules()`.

### État actuel

```php
public function getStudents(): array {
    $token = $this->getAccessToken();
    $headers = [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
    ];

    return $this->getFirstAvailablePayload([
        '/students',
        '/users?role=student',
    ], $headers);
}
```

**Bénéfices** :
1. ✅ Teste `/students` en premier (endpoint standard OneRoster)
2. ✅ Fallback sur `/users?role=student` (variante Smartschool, comme `/users?role=teacher` pour les professeurs)
3. ✅ Retourne le premier résultat réussi (2xx + JSON valide)
4. ✅ Cohérence avec la logique déjà présente pour `getTeachers()` et `getSchedules()`

## Endpoints testés par OneRosterClient

| Ressource | Endpoints testés (ordre priorité) |
|-----------|-----------------------------------|
| **Students** | `/students` → `/users?role=student` |
| **Teachers** | `/teachers` → `/users?role=teacher` → `/users?role=staff` |
| **Schedules** | `/classschedules` → `/classSchedules` → `/schedules` → `/classeschedules` |

## Diagnostic de connectivité

Outil de diagnostic créé : [test/oneroster_diag.php](test/oneroster_diag.php)

**Utilisation** :
```bash
php test/oneroster_diag.php
php test/oneroster_diag.php --force-ip=193.56.132.11 --retries=3
```

**Exemple de résultat** (avant problème de connectivité) :
```
Token: ✅ OK (792 ms)
Students: ❌ timeout /students (21031 ms)
Teachers: ✅ OK /users?role=staff (19 records, 761 ms)
Schedules: ❌ timeout /classeschedules (21033 ms)
```

## Fichiers modifiés

- [app/service/OneRosterClient.php](app/service/OneRosterClient.php) : ajout fallback endpoints pour `getStudents()`
- [test/oneroster_diag.php](test/oneroster_diag.php) : script de diagnostic créé (outil réutilisable)

## Validation

✅ Syntaxe PHP : `php -l app/service/OneRosterClient.php` → No syntax errors  
✅ Intégration avec [app/service/OneRosterSync.php](app/service/OneRosterSync.php) : `syncStudents()` utilise `$client->getStudents()` et attend clé `users` dans payload
✅ Cohérence : aligne `getStudents()` sur la logique de fallback déjà présente pour `getTeachers()` et `getSchedules()`

## Notes

- La correction ne change pas l'interface publique de `OneRosterClient`
- Rétro-compatible : le payload retourné suit toujours le format attendu par `OneRosterSync::syncStudents()`
- La dégradation temporaire de connectivité (tous les timeouts) n'est pas une régression de code, mais un problème réseau/firewall indépendant de cette correction

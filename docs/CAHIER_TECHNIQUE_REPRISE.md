# Cahier technique de reprise

## 1. Objectif du document

Ce document sert de dossier de reprise technique pour une nouvelle equipe.
Il decrit:

- le chemin des fonctionnalites (parcours utilisateur et flux applicatifs)
- la structure du projet
- les fichiers de configuration/reglage
- les services backend et API exposees
- les dependances, scripts, SQL, tests et points de vigilance

Perimetre: etat actuel du depot sur la branche principale.

## 2. Vue d ensemble

### 2.1 Stack technique

- Backend: PHP (architecture MVC maison)
- Frontend: JS vanilla (SPA avec chargement dynamique des vues HTML)
- Base de donnees: MySQL (acces PDO)
- Auth/session: session PHP + verification role + protection CSRF
- Integrations externes:
  - Smartschool WebService SOAP V3 (sync principale)
  - OneRoster (conserve en fallback/documentation)

### 2.2 Point d entree

- Front controller HTTP: public/index.php
- Bootstrap frontend SPA: public/js/main.js

## 3. Architecture du projet

## 3.1 Arborescence utile

- app/
  - config/: configuration runtime et secrets
  - controller/: endpoints web + API
  - core/: routeur, DB, regles metier scan
  - model/: acces donnees et logique CRUD
  - service/: services transverses (audit, CSRF, sync, validation...)
  - view/: layout PHP (shell principal)
- public/
  - html/: fragments de pages/sections (injectes dynamiquement)
  - js/: controllers/views/models frontend + API client
  - css/: styles
  - assets/: images/media
- sql/: schema de base, donnees de reference, migrations
- scripts/: scripts de maintenance/migration/diagnostic
- test/: scripts de verification manuelle et automatisations utilitaires
- docs/: documentation historique et rapports

## 3.2 Convention d architecture

- Le backend expose majoritairement des routes JSON sous /api/*.
- Le frontend consomme ces routes via public/js/api.js.
- Le routeur backend applique:
  - controle d acces par role
  - CSRF sur methodes mutantes API (sauf endpoints explicitement exclus)
- La navigation frontend est de type SPA (interception des liens internes).

## 4. Chemin des fonctionnalites

## 4.1 Authentification et ouverture de session

1. Affichage login
   - SessionView charge public/html/login.html.

2. Soumission credentials
   - API POST /api/login.
   - Verifications backend:
     - validation format/longueur
     - rate limit anti brute force
     - creation session PHP
     - rotation token CSRF
     - audit login (audit_logins)

3. Synchronisation a la connexion
   - AuthController lance SmartschoolSync::syncForLogin().
   - Priorite teachers + schedules, puis students si budget temps restant.

4. Routage role-based
   - Administrateur: acces complet + gestion
   - Gestionnaire: acces restreint (pas de gestion avancee)
   - Surveillant: acces scan + encodage manuel + logout

## 4.2 Scan des passages

1. Frontend envoie sourcedId a POST /api/scan.
2. Backend charge etudiant + horaire du jour + passages deja presents.
3. ScanRules calcule type_passage et statut selon:
  - fenetre midi deduite du planning via la matiere MIDI
  - autorisation de sortie
  - retard selon premier cours + tolerance
4. Movement est insere dans passages.
5. Frontend affiche resultat et met a jour presence journaliere locale.

Notes:

- Le module API frontend gere une file locale de passages en cas de reseau instable.
- Une resynchronisation automatique est tentee periodiquement et au retour online.

## 4.3 Encodage manuel

1. Formulaire manuel dans public/html/manualEncoding.html.
2. Appel API POST /api/movements/add.
3. Meme mecanisme de queue locale si indisponibilite reseau.

## 4.4 Absences

- Consultation absents du jour: GET /api/absents/today.
- Marquage absence: POST /api/absents/add.
- Marquage absence justifiee: POST /api/absents/add-justified.
- Persistance batch absences calculees cote client: POST /api/absents/persist-batch.

Important:

- Les actions absence sont journalisees dans audit_db_changes.
- Une logique locale frontend suit la presence journaliere et declenche la persistance batch selon seuils horaires.

## 4.5 Espace gestion

Le module management est sectionne en sous-domaines:

- passages
- parametres
- types de passage
- etudiants
- qr codes
- horaires
- creneaux
- classes
- locaux
- matieres
- professeurs
- audits
- utilisateurs

Le chargement est lazy par section (partials HTML + appels API associes).

## 4.6 Audits

Deux canaux principaux:

- audit_logins: connexions reussies
- audit_db_changes: changements de donnees (insert/update/delete/batch)

Consultation via:

- GET /api/audits/logins
- GET /api/audits/db-changes

Stockage DB uniquement (plus de dependance active a un fichier JSON d audit).

## 5. Configuration et reglages

## 5.1 Configuration environnement

Fichiers principaux:

- app/config/.env.example: modele de variables d environnement
- app/config/.env: fichier local non versionne (a creer)

Variables critiques:

- DB_HOST, DB_NAME, DB_USER, DB_PASS
- SMARTSCHOOL_CLIENT_ID, SMARTSCHOOL_CLIENT_SECRET
- ONEROSTER_CLIENT_ID, ONEROSTER_CLIENT_SECRET
- SMARTSCHOOL_WS_LOGIN, SMARTSCHOOL_PROFILE_PASSWORD

## 5.2 Configuration application

- app/config/config.php
  - construit le DSN MySQL
  - charge Dotenv

- app/config/routes.php
  - declare toutes les routes GET/POST (pages + API)

- app/config/settings.php
  - snapshot des reglages metier actifs

- app/config/settingBackup.php
  - historique des sauvegardes de reglages et diff des changements

- app/config/oauth_credentials.php
  - credentials OAuth Smartschool (issus de .env)

- app/config/oneroster.php
  - configuration OneRoster (URL, token endpoint, timeout)

- app/config/webService.php
  - credentials SOAP Smartschool

## 5.3 Controle d acces et securite

Mecanismes:

- headers de securite HTTP dans public/index.php
- CSRF (token session + header/body fallback) dans Router + API JS
- controle role/route dans app/core/router.php
- rate limiting login via RateLimiterService

## 6. Services backend

## 6.1 Services transverses

- AuditService
  - ecriture/lecture audits login + DB changes

- CsrfService
  - generation, validation, rotation de token CSRF

- ValidationService
  - validations techniques (UUID, string, etc.)

- RateLimiterService
  - limitation des tentatives login

## 6.2 Services d integration externe

- SmartschoolWebServiceV3Client
  - client SOAP V3 Smartschool

- SmartschoolSync
  - sync students/teachers/schedules (relations cours)
  - service principal appele au login

- OneRosterClient + OneRosterSync
  - integration OneRoster conservee (fallback/documentation)
  - non prioritaire en production courante

## 7. API exposee (resume)

## 7.1 Auth/session

- GET /api/csrf-token
- POST /api/login
- GET|POST /api/logout

## 7.2 Etudiants

- GET /api/students
- GET /api/students/{id}
- GET|POST /api/students/search
- POST /api/students/add
- POST /api/students/update
- POST /api/students/delete

## 7.3 Passages

- POST /api/scan
- GET /api/movements
- POST /api/movements/add
- POST /api/movements/update
- POST /api/movements/delete
- POST /api/movements/search
- GET /api/movements/search-by-student
- GET /api/movements/student/{id}
- GET /api/movements/reasons

## 7.4 Absences

- GET|POST /api/absents/today
- POST /api/absents/add
- GET /api/absents/add-justified
- POST /api/absents/persist-batch

## 7.5 Gestion referentiels et horaires

- GET/POST /api/schedules* (liste, add, update, delete, slots)
- GET/POST /api/classes*
- GET/POST /api/classroom*
- GET/POST /api/matieres*
- GET/POST /api/teachers*
- GET/POST /api/passage-metadata/{kind}*

## 7.6 Reglages/audits/export

- GET /api/settings
- GET /api/settings/backups
- POST /api/settings/update
- GET /api/audits/logins
- GET /api/audits/db-changes
- GET|POST /api/export/csv

## 8. Base de donnees et SQL

## 8.1 Fichiers structurants

- sql/CREATE_DB_Tables.sql
- sql/Backup_DB_CREATION_Tables.sql
- sql/INSERT *.sql
- sql/MIGRATION_*.sql

## 8.2 Migrations notables

- persistence audits DB: MIGRATION_audits_persistence_db.sql
- lookup passages (types/statuts/raisons)
- split creneaux debut/fin
- FK horaires vers creneaux + local
- champs passages scan/manual + demi journee absence

## 8.3 Regles de donnees importantes

- Libelles de passage a conserver strictement coherents:
  - type_passage: Aucun, Entree matin, Sortie midi, Rentree midi, Entree apres-midi, Sortie autorisee, Journee
  - statut: Autorise, Refuse, Absence justifiee, Sortie justifiee, Absent, En retard, Present

## 9. Frontend et logique offline

## 9.1 Architecture frontend

- RouteController: navigation SPA + garde role
- SessionController: login/logout/session check
- API client unique: public/js/api.js
- Views par ecran + sous-sections management

## 9.2 Resilience reseau

Dans public/js/api.js:

- journal local des passages en localStorage
- retries periodiques
- flush automatique au retour reseau
- cache local etudiants/horaires
- suivi local de presence jour + persistance batch absences

Limites:

- stockage local propre au navigateur/appareil
- effacement cache navigateur = perte file locale

## 10. Exploitation et reprise

## 10.1 Prerequis machine

- PHP compatible projet + extensions PDO MySQL
- MySQL
- Composer
- serveur web pointant sur public/

## 10.2 Mise en route rapide

1. Installer dependances PHP: composer install
2. Verifier dependances frontend: npm install
3. Creer app/config/.env a partir de .env.example
4. Initialiser schema SQL + migrations
5. Configurer serveur web vers public/index.php

## 10.3 Scripts utiles

- scripts/run_audit_migration.php
- scripts/check_audit_db.php
- scripts/_run_migration.php

## 10.4 Tests utiles

- test/test_api_login.php
- test/test_api_routes.ps1
- test/test_audits_page.php
- test/test_webservice_v3.php
- test/validate_login.php

## 11. Risques et points de vigilance

- Presence de doubles routes GET/POST pour certains endpoints: a rationaliser a terme.
- Une partie du controle role existe a la fois frontend (UX) et backend (autorite): conserver le backend comme source de verite.
- OneRoster conserve mais non prioritaire: valider avant remise en service.
- settingBackup.php est un stockage fichier local: prevoir strategie de retention/rotation si volumetrie.
- Eviter toute divergence des libelles passage entre SQL, PHP et JS.

## 12. Plan de passation recommande (nouvelle equipe)

Semaine 1:

1. Monter environnement local complet + imports SQL.
2. Valider login, scan, encodage manuel, absences, management.
3. Executer scripts/tests de smoke.

Semaine 2:

1. Cartographier dette technique (routes en doublon, normalisation API, couverture tests).
2. Poser un plan de refactor progressif sans casser les flux critiques.
3. Definir observabilite minimale (logs, alertes DB, suivi sync).

## 13. References internes

- Point entree serveur: public/index.php
- Routeur/ACL/CSRF: app/core/router.php
- Regles metier scan: app/core/ScanRules.php
- API frontend + offline: public/js/api.js
- Routage SPA: public/js/controller/routeController.js
- Session frontend: public/js/controller/sessionController.js
- Gestion frontend: public/js/controller/managementController.js
- Routes API: app/config/routes.php
- Config DB/env: app/config/config.php, app/config/.env.example
- Reglages metier: app/config/settings.php, app/config/settingBackup.php
- Audit backend: app/service/AuditService.php, app/controller/AuditsController.php
- Sync Smartschool: app/service/SmartschoolSync.php
- Sync OneRoster (conserve): app/service/OneRosterSync.php

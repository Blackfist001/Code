# Mode d emploi utilisateur

## 1. A qui s adresse ce guide

Ce guide est fait pour un utilisateur non forme (surveillant, gestionnaire, administratif) qui doit utiliser l application au quotidien.

Objectif: savoir quoi faire, dans quel ordre, et comment reagir en cas de probleme.

## 2. Avant de commencer

## 2.1 Connexion

1. Ouvrir l application.
2. Saisir:
   - Nom d utilisateur
   - Mot de passe
3. Cliquer sur Se connecter.

Si les identifiants sont corrects, vous arrivez sur votre espace.

## 2.2 Comprendre votre menu (selon votre profil)

### Profil Surveillant

- Scanner
- Encodage manuel
- Deconnexion

### Profil Gestionnaire

- Tableau de bord
- Scanner
- Encodage manuel
- Absents
- Recherche
- Historique
- Deconnexion

### Profil Administrateur

- Tableau de bord
- Scanner
- Encodage manuel
- Absents
- Recherche
- Historique
- Gestion (menu deroulant)
- Deconnexion

## 3. Utilisation quotidienne (par ordre recommande)

## 3.1 Ecran Scanner

Usage: enregistrer les passages avec carte et voir le resultat en direct.

1. Aller sur Scanner.
2. Verifier que la camera est active (message camera allumee).
3. Presenter la carte etudiant devant la camera.
4. Lire le resultat:
   - Nom
   - Classe
   - Type de passage
   - Statut
5. Verifier l emploi du temps du jour affiche en bas.

Bonnes pratiques:

- Laisser la camera allumee pendant les flux d entree/sortie.
- Verifier le statut affiche (Present, En retard, Autorise, Refuse).

## 3.2 Ecran Encodage manuel

Usage: corriger ou encoder un passage quand la carte n est pas lue.

1. Aller sur Encodage manuel.
2. Choisir la classe.
3. Choisir le nom puis le prenom.
4. Choisir:
   - Type
   - Statut
   - Raison (si demandee)
5. Verifier la date et l heure.
6. Cliquer sur Ajouter.
7. Verifier le message de confirmation et la table des derniers passages manuels.

## 3.3 Ecran Absents

Usage: suivre les absents du jour et marquer une absence si necessaire.

1. Aller sur Absents.
2. Lire la liste du jour:
   - date, nom, prenom, classe
   - type, statut
   - demi-journees d absences
   - source et raison
3. Si besoin, utiliser la zone Marquer comme absent (si elle est visible):
   - choisir classe, nom, prenom
   - choisir raison
   - cliquer sur Ajouter

## 3.4 Ecran Recherche

Usage: retrouver des passages d etudiants.

1. Aller sur Recherche.
2. Filtrer avec les listes (classe, nom, prenom, statut).
3. Lire les resultats dans le tableau.
4. Exporter si necessaire:
   - Exporter CSV
   - Exporter PDF

Note: les boutons d export peuvent rester desactives tant qu il n y a pas de resultat exploitable.

## 3.5 Ecran Historique

Usage: analyser une periode.

1. Aller sur Historique.
2. Regarder les statistiques par dates.
3. Choisir Date de debut et Date de fin.
4. Cliquer sur Filtrer.
5. Utiliser Exporter CSV ou Exporter PDF si besoin.

## 3.6 Tableau de bord

Usage: vision rapide de la situation du jour.

- bloc Statistiques du jour
- bloc Derniers passages

Conseil: commencer la journee ici pour verifier que tout fonctionne.

## 4. Mode Gestion (Administrateur)

Le menu Gestion contient des sections de parametres et de referentiels.

## 4.1 Passages

- Ajouter un passage manuellement (avec plus d options)
- Filtrer les passages par dates
- Exporter en CSV
- Modifier/Supprimer un passage

## 4.2 Etudiants

- Ajouter un etudiant
- Filtrer par classe/nom/autorisation midi
- Modifier/Supprimer un etudiant

## 4.3 QR Codes

- Generer/consulter les QR codes etudiants

## 4.4 Horaires, Creneaux, Classes, Locaux, Matieres, Professeurs

- gerer les donnees de base utilisees par le scan et les statistiques

## 4.5 Types de passage

- gerer les types/statuts/raisons utilises dans les formulaires et passages

## 4.6 Parametres

Permet de regler le comportement global:

 - duree d un cours
 - battement retard
 - recreation du matin
 - les regles de midi restent alignees sur la matiere MIDI du planning
 - les anciens reglages midi1 / midi2 servent de secours de compatibilite

Important:

 - Entree matin jusqu a et Entree apres-midi a partir de sont calcules automatiquement.
 - La logique de midi s'appuie sur le planning de l'etudiant, pas sur son annee.
 - Cliquer sur Enregistrer apres toute modification.
 - Utiliser Historique des sauvegardes pour comparer/restaurer un etat precedent.


## 4.7 Audits

Deux tableaux sont disponibles:

- Connexions (utilisateur, date, heure, IP)
- Modifications DB (qui a change quoi)

Usage recommande:

- cliquer sur Recharger avant controle
- utiliser cet ecran pour verifier les actions sensibles

## 4.8 Utilisateurs

- creer, modifier, supprimer des comptes
- attribuer le bon role (Surveillant, Gestionnaire, Administrateur)

## 5. Cas pratiques tres courants

## 5.1 Un etudiant a oublie sa carte

1. Aller sur Encodage manuel.
2. Selectionner classe + nom + prenom.
3. Encoder type/statut/date/heure.
4. Ajouter.

## 5.2 Une correction est demandee apres coup

1. Aller sur Historique ou Gestion > Passages.
2. Retrouver le passage avec les filtres.
3. Corriger ou supprimer selon consigne.

## 5.3 Verifier qui a fait une modification

1. Aller sur Gestion > Audits.
2. Ouvrir Modifications DB.
3. Lire la ligne (utilisateur, heure, action, donnees).

## 6. Depannage simple

## 6.1 Je n arrive pas a me connecter

- verifier le nom d utilisateur et le mot de passe
- verifier Caps Lock
- reessayer apres quelques minutes (protection anti tentatives)
- contacter un administrateur si le compte semble bloque

## 6.2 La camera ne lit pas le QR

- verifier que la camera est autorisee dans le navigateur
- verifier qu elle est allumee dans l ecran Scanner
- rapprocher ou eloigner la carte
- passer en Encodage manuel si urgence

## 6.3 Je n ai pas acces a un ecran

- c est souvent normal selon votre role
- demander a un administrateur si un changement de role est necessaire

## 6.4 Un bouton parait inactif

- verifier qu un choix obligatoire est fait (classe, nom, type, etc.)
- verifier les dates de filtre
- verifier qu il y a des donnees dans le tableau

## 7. Conseils de bonne utilisation

- Toujours verifier le statut affiche apres un scan.
- Eviter les doublons: attendre le message de retour avant de rescanner.
- Pour les modifications importantes, passer par Gestion et verifier dans Audits.
- Se deconnecter en fin de poste.

## 8. Rappel rapide des ecrans

- Scanner: enregistrement rapide par carte
- Encodage manuel: saisie de secours/correction
- Absents: suivi des absences du jour
- Recherche: retrouver des passages
- Historique: analyser une periode + exports
- Tableau de bord: vue synthese du jour
- Gestion (admin): administration des donnees et reglages

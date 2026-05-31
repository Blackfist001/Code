Règles métier

Ce document est aligné avec les règles déjà implémentées dans [app/core/ScanRules.php](app/core/ScanRules.php).

1. Règles de sortie midi (autorisation)
- Un étudiant majeur (18 ans ou plus) peut sortir sur le temps de midi avec le statut Autorisé.
- Un étudiant mineur ne peut sortir que si autorisation_midi est vraie.
- Sans autorisation, le statut est Refusé.

2. Fenetre de midi definie par le planning
- Le temps de midi est deduit de l'horaire de cours de l'etudiant.
- La presence d'une ligne de matiere MIDI dans le planning definit la fenetre de midi pour cette journee.
- En l'absence de ligne MIDI, le systeme conserve un repli de compatibilite.

3. Applicabilite du temps de midi
- Le temps de midi est pris en compte a partir du planning du jour de l'etudiant.
- Les regles d'age et d'autorisation parentale restent appliquees pour la Sortie midi.
- Si aucun creaneau MIDI n'est present, le scan retombe sur le comportement de secours pour rester exploitable.

4. Détermination du type de passage pendant midi
- Si un passage Sortie midi existe déjà dans la journée et qu'aucun passage Rentrée midi n'existe encore, le scan devient Rentrée midi (statut Autorisé).
- Sinon, le scan devient Sortie midi, avec statut Autorisé ou Refusé selon la règle d'autorisation.

5. Détermination du type de passage hors midi
- Hors fenêtre midi applicable, le type est Entrée matin.
- Le statut est En retard si l'heure du scan dépasse l'heure du premier cours + 5 minutes.
- Sinon, le statut est Présent.

6. Règle de retard
- La tolérance de retard est de 5 minutes après le début du premier cours du jour.
- L'heure du premier cours est lue dans l'horaire du jour de l'étudiant (pas une heure fixe globale).
- S'il n'y a aucun cours ce jour-là, aucun retard n'est calculé et le statut reste Présent.

7. Créneaux horaires de référence
- 8h15, 9h05, 10h10, 11h00, 11h50, 12h40, 13h30, 14h20, 15h10, 16h00.

8. Règles métier globales (hors ScanRules)
- Une alerte dashboard est attendue à 9 et 20 demi-journées d'absence.
- Une demi-journée d'absence correspond à 2 cours consécutifs non suivis sur l'avant-midi et/ou l'après-midi.
- Motifs de sortie justifiée (selon processus administratif) : autorisation parentale, cours non donné avec accord parent, excursion, situation exceptionnelle (blessure, infrastructure).

9. Alignement des libellés de passages
- Le libellé implémenté est Rentrée midi (et non Entrée midi).
- Les libellés utilisés doivent rester cohérents avec les enums de passages (type_passage/statut).
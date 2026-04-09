<?php
namespace App\Core;

/**
 * Règles métier du scanner de passages.
 *
 * Détermine, à partir des données d'un étudiant, de son emploi du temps du jour
 * et de ses passages déjà enregistrés, le type_passage et le statut à inscrire
 * en base de données.
 */
class ScanRules {

    // -----------------------------------------------------------------------
    // Constantes métier
    // -----------------------------------------------------------------------

    /** Tolérance de retard en minutes après le 1er cours */
    private const RETARD_TOLERANCE_MIN = 5;

    /** Fenêtre midi 1ères & 2èmes années : 11h50 – 12h40 */
    private const MIDI_1_DEBUT = 11 + 50 / 60;
    private const MIDI_1_FIN   = 12 + 40 / 60;

    /** Fenêtre midi 3ème – 6ème années : 12h40 – 13h30 */
    private const MIDI_2_DEBUT = 12 + 40 / 60;
    private const MIDI_2_FIN   = 13 + 30 / 60;

    // -----------------------------------------------------------------------
    // Méthode principale
    // -----------------------------------------------------------------------

    /**
     * Calcule le type_passage et le statut pour un scan.
     *
     * @param array $student         Ligne etudiants (id_etudiant, classe, date_naissance, autorisation_midi)
     * @param array $coursAujourdhui Résultat de SchedulesModel::getScheduleByClassAndDay(), trié heure_debut ASC
     * @param array $passagesTypes   Résultat de MovementsModel::getTodayPassageTypes() (types déjà enregistrés aujourd'hui)
     * @param \DateTime|null $now    Moment du scan (null = maintenant)
     *
     * @return array{type_passage: string, statut: string}
     */
    public function calculer(
        array $student,
        array $coursAujourdhui,
        array $passagesTypes,
        ?\DateTime $now = null
    ): array {
        $now           = $now ?? new \DateTime();
        $heureDecimale = $this->toDecimal($now->format('H:i'));

        // Année scolaire extraite de la classe (ex: "1A" → 1, "3B" → 3)
        preg_match('/(\d+)/', $student['classe'] ?? '', $matches);
        $annee = isset($matches[1]) ? (int)$matches[1] : 0;

        // Fenêtre midi de l'étudiant selon son année
        [$midiDebut, $midiFin] = $this->fenetreMidi($annee);

        // Le temps de midi n'existe que si l'étudiant a des cours avant ET après la fenêtre
        $hasMidi = $this->hasMidi($coursAujourdhui, $midiDebut, $midiFin);

        // Seuil de retard = heure_debut du 1er cours + tolérance
        $limiteRetard = $this->limiteRetard($coursAujourdhui);

        // On est dans la fenêtre midi ET le midi est applicable
        $estMidi = $hasMidi
            && $heureDecimale >= $midiDebut
            && $heureDecimale <= $midiFin;

        if ($estMidi) {
            return $this->regleMidi($student, $passagesTypes, $now);
        }

        return $this->regleArrivee($heureDecimale, $limiteRetard);
    }

    // -----------------------------------------------------------------------
    // Règles internes
    // -----------------------------------------------------------------------

    /**
     * Règle arrivée matin : présent ou en retard.
     */
    private function regleArrivee(float $heure, ?float $limiteRetard): array {
        if ($limiteRetard !== null && $heure > $limiteRetard) {
            $statut = 'En retard';
        } else {
            $statut = 'Présent';
        }

        return ['type_passage' => 'Entrée matin', 'statut' => $statut];
    }

    /**
     * Règle temps de midi : sortie ou retour, autorisé ou refusé.
     */
    private function regleMidi(array $student, array $passagesTypes, \DateTime $now): array {
        // Si déjà sorti sans être revenu → c'est un retour
        if (in_array('Sortie midi', $passagesTypes, true) && !in_array('Rentrée midi', $passagesTypes, true)) {
            return ['type_passage' => 'Rentrée midi', 'statut' => 'Autorisé'];
        }

        // Première sortie midi
        $age = $this->age($student['date_naissance'] ?? null, $now);

        if ($age !== null && $age >= 18) {
            $statut = 'Autorisé'; // Majeur : libre
        } elseif (!empty($student['autorisation_midi'])) {
            $statut = 'Autorisé'; // Autorisation parentale
        } else {
            $statut = 'Refusé';   // Mineur sans autorisation
        }

        return ['type_passage' => 'Sortie midi', 'statut' => $statut];
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Convertit "hh:mm[:ss]" en heure décimale.
     */
    private function toDecimal(string $time): float {
        [$h, $m] = explode(':', $time);
        return (int)$h + (int)$m / 60.0;
    }

    /**
     * Retourne [debut, fin] de la fenêtre midi selon l'année scolaire.
     */
    private function fenetreMidi(int $annee): array {
        if ($annee === 1 || $annee === 2) {
            return [self::MIDI_1_DEBUT, self::MIDI_1_FIN];
        }
        return [self::MIDI_2_DEBUT, self::MIDI_2_FIN];
    }

    /**
     * Vérifie qu'il y a des cours avant ET après la fenêtre midi.
     */
    private function hasMidi(array $cours, float $midiDebut, float $midiFin): bool {
        $avant  = false;
        $apres  = false;
        foreach ($cours as $c) {
            $d = $this->toDecimal($c['heure_debut']);
            if ($d < $midiDebut) $avant  = true;
            if ($d >= $midiFin)  $apres  = true;
        }
        return $avant && $apres;
    }

    /**
     * Calcule le seuil de retard (heure du 1er cours + tolérance).
     * Retourne null si aucun cours ce jour.
     */
    private function limiteRetard(array $cours): ?float {
        if (empty($cours)) {
            return null;
        }
        return $this->toDecimal($cours[0]['heure_debut']) + self::RETARD_TOLERANCE_MIN / 60.0;
    }

    /**
     * Calcule l'âge en années entières. Retourne null si date inconnue.
     */
    private function age(?string $dateNaissance, \DateTime $now): ?int {
        if (empty($dateNaissance)) {
            return null;
        }
        return (int)$now->diff(new \DateTime($dateNaissance))->y;
    }

    // -----------------------------------------------------------------------
    // Labels (utilitaire statique pour les contrôleurs)
    // -----------------------------------------------------------------------

    public static function typeLabels(): array {
        return [
            'Aucun' => 'Aucun',
            'Entrée matin' => 'Entrée matin',
            'Sortie midi' => 'Sortie midi',
            'Rentrée midi' => 'Rentrée midi',
            'Entrée après-midi' => 'Entrée après-midi',
            'Sortie autorisée' => 'Sortie autorisée',
            'Journée' => 'Journée',
        ];
    }

    public static function statutLabels(): array {
        return [
            'Autorisé' => 'Autorisé',
            'Refusé' => 'Refusé',
            'Absence justifiée' => 'Absence justifiée',
            'Sortie justifiée' => 'Sortie justifiée',
            'Absent' => 'Absent',
            'En retard' => 'En retard',
            'Présent' => 'Présent',
        ];
    }
}

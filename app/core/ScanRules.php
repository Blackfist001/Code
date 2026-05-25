<?php
namespace App\Core;

use App\Model\SettingsModel;

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

    /** @var array<string,mixed>|null */
    private ?array $runtimeSettings = null;

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
        $settings      = $this->getRuntimeSettings();

        // Année scolaire extraite de la classe (ex: "1A" → 1, "3B" → 3)
        preg_match('/(\d+)/', $student['classe'] ?? '', $matches);
        $annee = isset($matches[1]) ? (int)$matches[1] : 0;

        // Fenêtre midi de l'étudiant selon son année
        [$midiDebut, $midiFin] = $this->fenetreMidi($annee, $settings);

        // Le temps de midi n'existe que si l'étudiant a des cours avant ET après la fenêtre
        $hasMidi = $this->hasMidi($coursAujourdhui, $midiDebut, $midiFin);

        $aUneSortieMidi = in_array('Sortie midi', $passagesTypes, true);
        $aUneRentreeMidi = in_array('Rentrée midi', $passagesTypes, true);
        $aUneEntreeMatin = in_array('Entrée matin', $passagesTypes, true);

        // Seuil de retard = heure_debut du 1er cours + tolérance
        $limiteRetard = $this->limiteRetard($coursAujourdhui, (int)$settings['late_tolerance_min']);

        // On est dans la fenêtre midi ET le midi est applicable
        $estMidi = $hasMidi
            && $aUneEntreeMatin
            && $heureDecimale >= $midiDebut
            && $heureDecimale <= $midiFin;

        if ($estMidi) {
            return $this->regleMidi($student, $passagesTypes, $now, $midiFin, $aUneSortieMidi, $aUneRentreeMidi);
        }

        if ($aUneSortieMidi && !$aUneRentreeMidi && $heureDecimale > $midiFin) {
            return ['type_passage' => 'Rentrée midi', 'statut' => 'En retard'];
        }

        return $this->regleArrivee(
            $heureDecimale,
            $limiteRetard,
            $passagesTypes,
            (float)$settings['morning_entry_end_decimal'],
            (float)$settings['afternoon_entry_start_decimal']
        );
    }

    // -----------------------------------------------------------------------
    // Règles internes
    // -----------------------------------------------------------------------

    /**
     * Règle arrivée matin : présent ou en retard.
     */
    private function regleArrivee(
        float $heure,
        ?float $limiteRetard,
        array $passagesTypes,
        float $morningEntryEnd,
        float $afternoonEntryStart
    ): array {
        if ($heure >= $afternoonEntryStart && !in_array('Entrée matin', $passagesTypes, true)) {
            return ['type_passage' => 'Entrée après-midi', 'statut' => 'Présent'];
        }

        $limiteRetardApplicable = $limiteRetard;
        if ($heure > $morningEntryEnd) {
            $limiteRetardApplicable = min($limiteRetardApplicable ?? $heure, $morningEntryEnd);
        }

        if ($limiteRetardApplicable !== null && $heure > $limiteRetardApplicable) {
            $statut = 'En retard';
        } else {
            $statut = 'Présent';
        }

        return ['type_passage' => 'Entrée matin', 'statut' => $statut];
    }

    /**
     * Règle temps de midi : sortie ou retour, autorisé ou refusé.
     */
    private function regleMidi(
        array $student,
        array $passagesTypes,
        \DateTime $now,
        float $midiFin,
        bool $aUneSortieMidi,
        bool $aUneRentreeMidi
    ): array {
        // Si déjà sorti sans être revenu → c'est un retour
        if ($aUneSortieMidi && !$aUneRentreeMidi) {
            $statut = 'Présent';
            if ($this->toDecimal($now->format('H:i')) > $midiFin) {
                $statut = 'En retard';
            }

            return ['type_passage' => 'Rentrée midi', 'statut' => $statut];
        }

        // Première sortie midi
        $age = $this->age($student['date_naissance'] ?? null, $now);

        if ($age !== null && $age < 15) {
            $statut = 'Refusé'; // Interdiction stricte avant 15 ans
        } elseif ($age !== null && $age >= 18) {
            $statut = 'Autorisé'; // Majeur : libre
        } elseif (!empty($student['autorisation_midi'])) {
            $statut = 'Autorisé'; // 15-17 ans avec autorisation
        } else {
            $statut = 'Refusé';   // 15-17 ans sans autorisation (ou âge inconnu)
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
    private function fenetreMidi(int $annee, array $settings): array {
        $midi1Years = $settings['midi1_years'] ?? [1, 2];
        if (in_array($annee, $midi1Years, true)) {
            return [(float)$settings['midi1_start_decimal'], (float)$settings['midi1_end_decimal']];
        }
        return [(float)$settings['midi2_start_decimal'], (float)$settings['midi2_end_decimal']];
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
    private function limiteRetard(array $cours, int $toleranceMin): ?float {
        if (empty($cours)) {
            return null;
        }
        return $this->toDecimal($cours[0]['heure_debut']) + max(0, $toleranceMin) / 60.0;
    }

    /**
     * Charge les paramètres métier configurables avec fallback robuste.
     *
     * @return array<string,mixed>
     */
    private function getRuntimeSettings(): array {
        if (is_array($this->runtimeSettings)) {
            return $this->runtimeSettings;
        }

        $defaults = [
            'late_tolerance_min' => self::RETARD_TOLERANCE_MIN,
            'midi1_start' => '11:50',
            'midi1_end' => '12:40',
            'midi2_start' => '12:40',
            'midi2_end' => '13:30',
            'midi1_years' => [1, 2],
            'midi2_years' => [3, 4, 5, 6, 7, 8],
            'morning_entry_end' => '11:49',
            'afternoon_entry_start' => '13:31',
        ];

        try {
            $rows = (new SettingsModel())->getAllSettings();

            $defaults['late_tolerance_min'] = (int)($rows['late_tolerance_min'] ?? $defaults['late_tolerance_min']);
            $defaults['midi1_start'] = (string)($rows['midi1_start'] ?? $defaults['midi1_start']);
            $defaults['midi1_end'] = (string)($rows['midi1_end'] ?? $defaults['midi1_end']);
            $defaults['midi2_start'] = (string)($rows['midi2_start'] ?? $defaults['midi2_start']);
            $defaults['midi2_end'] = (string)($rows['midi2_end'] ?? $defaults['midi2_end']);
            $defaults['midi1_years'] = $this->parseYearList((string)($rows['midi1_years'] ?? '1,2'), [1, 2]);
            $defaults['midi2_years'] = $this->parseYearList((string)($rows['midi2_years'] ?? '3,4,5,6,7,8'), [3, 4, 5, 6, 7, 8]);
            $defaults['morning_entry_end'] = (string)($rows['morning_entry_end'] ?? $defaults['morning_entry_end']);
            $defaults['afternoon_entry_start'] = (string)($rows['afternoon_entry_start'] ?? $defaults['afternoon_entry_start']);
        } catch (\Throwable $e) {
            // Fallback silencieux : conserver les valeurs par défaut
        }

        $defaults['midi1_start_decimal'] = $this->toDecimal($defaults['midi1_start']);
        $defaults['midi1_end_decimal'] = $this->toDecimal($defaults['midi1_end']);
        $defaults['midi2_start_decimal'] = $this->toDecimal($defaults['midi2_start']);
        $defaults['midi2_end_decimal'] = $this->toDecimal($defaults['midi2_end']);
        $defaults['morning_entry_end_decimal'] = $this->toDecimal($defaults['morning_entry_end']);
        $defaults['afternoon_entry_start_decimal'] = $this->toDecimal($defaults['afternoon_entry_start']);

        $this->runtimeSettings = $defaults;
        return $this->runtimeSettings;
    }

    /**
     * @param string $csv
     * @param int[] $fallback
     * @return int[]
     */
    private function parseYearList(string $csv, array $fallback): array {
        $tokens = preg_split('/\s*,\s*/', trim($csv)) ?: [];
        $years = [];
        foreach ($tokens as $token) {
            if ($token === '' || !ctype_digit($token)) {
                continue;
            }
            $y = (int)$token;
            if ($y >= 1 && $y <= 12) {
                $years[] = $y;
            }
        }

        $years = array_values(array_unique($years));
        return $years ?: $fallback;
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

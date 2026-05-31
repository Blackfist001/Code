<?php
namespace App\Controller;

use App\Model\SettingsModel;

class SettingsController {
    private SettingsModel $settingsModel;

    public function __construct() {
        $this->settingsModel = new SettingsModel();
    }

    public function getAll(): void {
        header('Content-Type: application/json');

        try {
            $settings = $this->settingsModel->getAllSettings();
            echo json_encode([
                'success' => true,
                'results' => $settings,
            ]);
        } catch (\Throwable $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function update(): void {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                echo json_encode(['success' => false, 'message' => 'Payload invalide.']);
                return;
            }

            $normalized = $this->validateAndNormalize($input);
            $this->settingsModel->updateSettings($normalized);

            echo json_encode([
                'success' => true,
                'message' => 'Paramètres enregistrés avec succès.',
                'results' => $normalized,
            ]);
        } catch (\InvalidArgumentException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        } catch (\Throwable $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function backups(): void {
        header('Content-Type: application/json');

        try {
            $backups = $this->settingsModel->getSettingBackups();
            echo json_encode([
                'success' => true,
                'results' => $backups,
            ]);
        } catch (\Throwable $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @param array<string,mixed> $input
     * @return array<string,string|int>
     */
    private function validateAndNormalize(array $input): array {
        $courseDurationMin = (int)($input['course_duration_min'] ?? 50);
        $lateToleranceMin = (int)($input['late_tolerance_min'] ?? 5);
        $midiMatiereId = trim((string)($input['midi_matiere_id'] ?? ''));

        $midi1Start = $this->normalizeTime((string)($input['midi1_start'] ?? '11:50'), 'midi1_start');
        $midi1End = $this->normalizeTime((string)($input['midi1_end'] ?? '12:40'), 'midi1_end');
        $midi2Start = $this->normalizeTime((string)($input['midi2_start'] ?? '12:40'), 'midi2_start');
        $midi2End = $this->normalizeTime((string)($input['midi2_end'] ?? '13:30'), 'midi2_end');

        // Champs derives automatiquement:
        // - Entree matin jusqu'a = midi1_start - 1 minute
        // - Entree apres-midi a partir de = midi2_end + 1 minute
        $morningEnd = $this->shiftTimeByMinutes($midi1Start, -1, 'morning_entry_end');
        $afternoonStart = $this->shiftTimeByMinutes($midi2End, 1, 'afternoon_entry_start');
        $morningBreakTime = $this->normalizeTime((string)($input['morning_break_time'] ?? '09:55'), 'morning_break_time');
        $morningBreakDurationMin = (int)($input['morning_break_duration_min'] ?? 15);

        $midi1Years = $this->normalizeYearList((string)($input['midi1_years'] ?? '1,2'), 'midi1_years');
        $midi2Years = $this->normalizeYearList((string)($input['midi2_years'] ?? '3,4,5,6,7,8'), 'midi2_years');

        if ($courseDurationMin <= 0 || $courseDurationMin > 240) {
            throw new \InvalidArgumentException('La durée d\'un cours doit être comprise entre 1 et 240 minutes.');
        }

        if ($lateToleranceMin < 0 || $lateToleranceMin > 120) {
            throw new \InvalidArgumentException('Le temps de battement doit être compris entre 0 et 120 minutes.');
        }

        if ($morningBreakDurationMin < 0 || $morningBreakDurationMin > 120) {
            throw new \InvalidArgumentException('La durée de récréation du matin doit être comprise entre 0 et 120 minutes.');
        }

        if ($midiMatiereId !== '' && !ctype_digit($midiMatiereId)) {
            throw new \\InvalidArgumentException('La matière MIDI sélectionnée est invalide.');
        }

        $m1s = $this->toMinutes($midi1Start);
        $m1e = $this->toMinutes($midi1End);
        $m2s = $this->toMinutes($midi2Start);
        $m2e = $this->toMinutes($midi2End);
        $me = $this->toMinutes($morningEnd);
        $as = $this->toMinutes($afternoonStart);

        if ($m1s >= $m1e) {
            throw new \InvalidArgumentException('La fenêtre midi 1 est incohérente (début >= fin).');
        }

        if ($m2s >= $m2e) {
            throw new \InvalidArgumentException('La fenêtre midi 2 est incohérente (début >= fin).');
        }

        if ($m1e > $m2s) {
            throw new \InvalidArgumentException('La fenêtre midi 1 ne peut pas dépasser le début de midi 2.');
        }

        if ($me >= $as) {
            throw new \InvalidArgumentException('La fin d\'entrée matin doit être strictement avant le début d\'entrée après-midi.');
        }

        $overlap = array_intersect($midi1Years, $midi2Years);
        if (!empty($overlap)) {
            throw new \InvalidArgumentException('Les années de midi 1 et midi 2 ne peuvent pas se chevaucher.');
        }

        return [
            'course_duration_min' => $courseDurationMin,
            'late_tolerance_min' => $lateToleranceMin,
            'midi_matiere_id' => $midiMatiereId,
            'midi1_start' => $midi1Start,
            'midi1_end' => $midi1End,
            'midi2_start' => $midi2Start,
            'midi2_end' => $midi2End,
            'midi1_years' => implode(',', $midi1Years),
            'midi2_years' => implode(',', $midi2Years),
            'morning_entry_end' => $morningEnd,
            'afternoon_entry_start' => $afternoonStart,
            'morning_break_duration_min' => $morningBreakDurationMin,
            'morning_break_time' => $morningBreakTime,
        ];
    }

    private function normalizeTime(string $value, string $field): string {
        $time = trim($value);
        if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $time, $m)) {
            throw new \InvalidArgumentException(sprintf('Format invalide pour %s. Utilise HH:MM.', $field));
        }

        return sprintf('%02d:%02d', (int)$m[1], (int)$m[2]);
    }

    /**
     * @return int[]
     */
    private function normalizeYearList(string $csv, string $field): array {
        $parts = preg_split('/\s*,\s*/', trim($csv)) ?: [];
        $years = [];
        foreach ($parts as $part) {
            if ($part === '' || !ctype_digit($part)) {
                continue;
            }
            $year = (int)$part;
            if ($year < 1 || $year > 12) {
                throw new \InvalidArgumentException(sprintf('Valeur d\'année invalide (%d) pour %s.', $year, $field));
            }
            $years[] = $year;
        }

        $years = array_values(array_unique($years));
        if (empty($years)) {
            throw new \InvalidArgumentException(sprintf('La liste %s ne peut pas être vide.', $field));
        }

        sort($years);
        return $years;
    }

    private function toMinutes(string $time): int {
        [$h, $m] = explode(':', $time);
        return ((int)$h * 60) + (int)$m;
    }

    private function toHHMM(int $minutes): string {
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;
        return sprintf('%02d:%02d', $h, $m);
    }

    private function shiftTimeByMinutes(string $baseTime, int $delta, string $field): string {
        $baseMinutes = $this->toMinutes($baseTime);
        $shifted = $baseMinutes + $delta;
        if ($shifted < 0 || $shifted > 1439) {
            throw new \InvalidArgumentException(sprintf(
                'Impossible de calculer %s a partir de %s (%+d min hors plage 00:00-23:59).',
                $field,
                $baseTime,
                $delta
            ));
        }

        return $this->toHHMM($shifted);
    }
}

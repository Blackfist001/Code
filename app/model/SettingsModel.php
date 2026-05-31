<?php
namespace App\Model;

use App\Service\AuditService;

class SettingsModel {
    private string $settingsFilePath;
    private string $backupFilePath;

    /** @var array<string,string> */
    private array $defaults = [
        'course_duration_min' => '50',
        'late_tolerance_min' => '5',
        'midi_matiere_id' => '',
        'midi1_start' => '11:50',
        'midi1_end' => '12:40',
        'midi2_start' => '12:40',
        'midi2_end' => '13:30',
        'midi1_years' => '1,2',
        'midi2_years' => '3,4,5,6,7,8',
        'morning_entry_end' => '11:49',
        'afternoon_entry_start' => '13:31',
        'morning_break_duration_min' => '15',
        'morning_break_time' => '09:55',
    ];

    public function __construct() {
        $this->settingsFilePath = dirname(__DIR__) . '/config/settings.php';
        $this->backupFilePath = dirname(__DIR__) . '/config/settingBackup.php';
    }

    private function ensureSettingsFile(): void {
        if (is_file($this->settingsFilePath)) {
            return;
        }

        $content = "<?php\nreturn " . var_export($this->defaults, true) . ";\n";
        file_put_contents($this->settingsFilePath, $content, LOCK_EX);
    }

    private function ensureBackupFile(): void {
        if (is_file($this->backupFilePath)) {
            return;
        }

        $content = "<?php\nreturn [];\n";
        file_put_contents($this->backupFilePath, $content, LOCK_EX);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public function getSettingBackups(): array {
        $this->ensureBackupFile();

        $fileData = require $this->backupFilePath;
        if (!is_array($fileData)) {
            return [];
        }

        $backups = [];
        foreach ($fileData as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $settings = $entry['settings'] ?? null;
            if (!is_array($settings)) {
                continue;
            }

            $normalizedSettings = $this->defaults;
            foreach ($settings as $k => $v) {
                $key = (string)$k;
                if (!array_key_exists($key, $normalizedSettings)) {
                    continue;
                }
                $normalizedSettings[$key] = (string)$v;
            }

            $backups[] = [
                'id' => (string)($entry['id'] ?? ''),
                'modified_at' => (string)($entry['modified_at'] ?? ''),
                'settings' => $normalizedSettings,
                'tracked_changes' => is_array($entry['tracked_changes'] ?? null) ? $entry['tracked_changes'] : [],
            ];
        }

        usort($backups, static function (array $a, array $b): int {
            return strcmp((string)$b['modified_at'], (string)$a['modified_at']);
        });

        return $backups;
    }

    /**
     * @param array<string,string> $previousSettings
     * @param array<string,string> $nextSettings
     */
    private function appendBackup(array $previousSettings, array $nextSettings): void {
        $this->ensureBackupFile();

        $backups = $this->getSettingBackups();
        array_unshift($backups, [
            'id' => date('YmdHis') . '-' . bin2hex(random_bytes(4)),
            'modified_at' => date('Y-m-d H:i:s'),
            'settings' => $previousSettings,
            'tracked_changes' => $this->extractTrackedChanges($previousSettings, $nextSettings),
        ]);

        $content = "<?php\nreturn " . var_export($backups, true) . ";\n";
        file_put_contents($this->backupFilePath, $content, LOCK_EX);
    }

    /**
     * @param array<string,string> $previousSettings
     * @param array<string,string> $nextSettings
     * @return array<string,array<string,string>>
     */
    private function extractTrackedChanges(array $previousSettings, array $nextSettings): array {
        $keys = [
            'morning_break_duration_min',
            'morning_break_time',
            'midi_matiere_id',
            'midi1_start',
            'midi1_end',
            'midi2_start',
            'midi2_end',
            'morning_entry_end',
            'afternoon_entry_start',
        ];

        $changes = [];
        foreach ($keys as $key) {
            $oldValue = (string)($previousSettings[$key] ?? '');
            $newValue = (string)($nextSettings[$key] ?? '');
            if ($oldValue === $newValue) {
                continue;
            }

            $changes[$key] = [
                'old' => $oldValue,
                'new' => $newValue,
            ];
        }

        return $changes;
    }

    /**
     * @return array<string,string>
     */
    public function getAllSettings(): array {
        $this->ensureSettingsFile();

        $fileData = require $this->settingsFilePath;
        if (!is_array($fileData)) {
            return $this->defaults;
        }

        $settings = $this->defaults;
        foreach ($fileData as $key => $value) {
            $k = (string)$key;
            if (!array_key_exists($k, $settings)) {
                continue;
            }
            $settings[$k] = (string)$value;
        }

        return $settings;
    }

    /**
     * @param array<string,string|int> $settings
     */
    public function updateSettings(array $settings): void {
        $this->ensureSettingsFile();

        $current = $this->getAllSettings();
        $merged = $current;
        foreach ($settings as $key => $value) {
            $k = (string)$key;
            if (!array_key_exists($k, $merged)) {
                continue;
            }
            $merged[$k] = (string)$value;
        }

        if ($merged !== $current) {
            $this->appendBackup($current, $merged);
            AuditService::logDbChange('update', 'settings', $current, $merged, [
                'tracked_changes' => $this->extractTrackedChanges($current, $merged),
            ]);
        }

        $content = "<?php\nreturn " . var_export($merged, true) . ";\n";
        file_put_contents($this->settingsFilePath, $content, LOCK_EX);
    }
}

<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use RuntimeException;

class PassageMetadataModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    private function getConfig(string $kind): array {
        $map = [
            'types' => [
                'table' => 'types_passage',
                'id' => 'id_type_passage',
                'label' => 'label',
                'sync_fk' => 'id_type_passage',
                'title' => 'type de passage',
            ],
            'statuses' => [
                'table' => 'statuts_passage',
                'id' => 'id_statut_passage',
                'label' => 'label',
                'sync_fk' => 'id_statut_passage',
                'title' => 'statut de passage',
            ],
            'reasons' => [
                'table' => 'raisons_passage',
                'id' => 'id_raison_passage',
                'label' => 'label',
                'sync_fk' => 'id_raison_passage',
                'title' => 'raison de passage',
            ],
        ];

        if (!isset($map[$kind])) {
            throw new RuntimeException('Type de métadonnée invalide.');
        }

        return $map[$kind];
    }

    public function getAll(string $kind): array {
        $config = $this->getConfig($kind);
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query(
            sprintf(
                'SELECT %1$s AS id, code, legacy_value, %2$s AS label, is_system, sort_order FROM %3$s ORDER BY sort_order ASC, %2$s ASC',
                $config['id'],
                $config['label'],
                $config['table']
            )
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function normalizeCode(string $label): string {
        $raw = trim($label);
        if ($raw === '') {
            return 'valeur';
        }

        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $raw);
        if ($ascii === false || $ascii === null || $ascii === '') {
            $ascii = $raw;
        }

        $ascii = strtolower($ascii);
        $ascii = preg_replace('/[^a-z0-9]+/', '_', $ascii) ?? '';
        $ascii = trim($ascii, '_');

        return $ascii !== '' ? $ascii : 'valeur';
    }

    private function ensureUniqueCode(string $table, string $baseCode): string {
        $pdo = $this->db->getPdo();
        $code = $baseCode;
        $suffix = 2;

        while (true) {
            $check = $pdo->prepare(sprintf('SELECT 1 FROM %s WHERE code = :code LIMIT 1', $table));
            $check->execute([':code' => $code]);
            if (!$check->fetchColumn()) {
                return $code;
            }
            $code = sprintf('%s_%d', $baseCode, $suffix);
            $suffix++;
        }
    }

    public function create(string $kind, string $label): void {
        $config = $this->getConfig($kind);
        $label = trim($label);
        if ($label === '') {
            throw new RuntimeException('Le libellé est requis.');
        }

        $pdo = $this->db->getPdo();

        $check = $pdo->prepare(sprintf('SELECT 1 FROM %s WHERE %s = :label LIMIT 1', $config['table'], $config['label']));
        $check->execute([':label' => $label]);
        if ($check->fetchColumn()) {
            throw new RuntimeException('Ce libellé existe déjà.');
        }

        $baseCode = $this->normalizeCode($label);
        $code = $this->ensureUniqueCode($config['table'], $baseCode);

        $sortStmt = $pdo->query(sprintf('SELECT COALESCE(MAX(sort_order), 0) FROM %s', $config['table']));
        $nextSort = ((int)$sortStmt->fetchColumn()) + 10;

        $insert = $pdo->prepare(sprintf(
            'INSERT INTO %s (code, legacy_value, %s, is_system, sort_order) VALUES (:code, NULL, :label, 0, :sort_order)',
            $config['table'],
            $config['label']
        ));
        $insert->execute([
            ':code' => $code,
            ':label' => $label,
            ':sort_order' => $nextSort,
        ]);

        if ($insert->rowCount() > 0) {
            $newRowStmt = $pdo->prepare(sprintf('SELECT * FROM %s WHERE code = :code LIMIT 1', $config['table']));
            $newRowStmt->execute([':code' => $code]);
            $newRow = $newRowStmt->fetch(PDO::FETCH_ASSOC) ?: ['code' => $code, 'label' => $label];
            \App\Service\AuditService::logDbChange('insert', $config['table'], null, $newRow);
        }
    }

    public function updateLabel(string $kind, int $id, string $label): void {
        $config = $this->getConfig($kind);
        $label = trim($label);
        if ($label === '') {
            throw new RuntimeException('Le libellé est requis.');
        }

        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(sprintf('SELECT * FROM %s WHERE %s = :id LIMIT 1', $config['table'], $config['id']));
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException('Élément introuvable.');
        }

        $check = $pdo->prepare(sprintf('SELECT 1 FROM %s WHERE %s = :label AND %s <> :id LIMIT 1', $config['table'], $config['label'], $config['id']));
        $check->execute([':label' => $label, ':id' => $id]);
        if ($check->fetchColumn()) {
            throw new RuntimeException('Ce libellé existe déjà.');
        }

        $update = $pdo->prepare(sprintf('UPDATE %s SET %s = :label WHERE %s = :id', $config['table'], $config['label'], $config['id']));
        $update->execute([':label' => $label, ':id' => $id]);

        if ($update->rowCount() > 0) {
            $newStmt = $pdo->prepare(sprintf('SELECT * FROM %s WHERE %s = :id LIMIT 1', $config['table'], $config['id']));
            $newStmt->execute([':id' => $id]);
            $newRow = $newStmt->fetch(PDO::FETCH_ASSOC) ?: null;
            \App\Service\AuditService::logDbChange('update', $config['table'], $row, $newRow);
        }
    }

    public function delete(string $kind, int $id): void {
        $config = $this->getConfig($kind);
        $pdo = $this->db->getPdo();

        $stmt = $pdo->prepare(sprintf('SELECT * FROM %s WHERE %s = :id LIMIT 1', $config['table'], $config['id']));
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException('Élément introuvable.');
        }

        $isSystem = (int)($row['is_system'] ?? 0) === 1;
        $isProtectedKind = in_array($kind, ['types', 'statuses'], true);
        if ($isProtectedKind && $isSystem) {
            throw new RuntimeException('Suppression impossible: valeur système protégée.');
        }

        $count = $pdo->prepare(sprintf('SELECT COUNT(*) FROM passages WHERE %s = :id', $config['sync_fk']));
        $count->execute([':id' => $id]);
        if ((int)$count->fetchColumn() > 0) {
            throw new RuntimeException(sprintf('Suppression impossible: ce %s est déjà utilisé dans des passages.', $config['title']));
        }

        $delete = $pdo->prepare(sprintf('DELETE FROM %s WHERE %s = :id', $config['table'], $config['id']));
        $delete->execute([':id' => $id]);

        if ($delete->rowCount() > 0) {
            \App\Service\AuditService::logDbChange('delete', $config['table'], $row, null);
        }
    }
}

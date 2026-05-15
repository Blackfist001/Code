<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class TimeSlotModel {
    private DataBase $db;

    private const TYPE_DEBUT = 'debut';
    private const TYPE_FIN = 'fin';

    public function __construct() {
        $this->db = new DataBase();
    }

    private function tableForType(string $type): string {
        return strtolower($type) === self::TYPE_FIN
            ? 'creneau_horaire_fin'
            : 'creneau_horaire_debut';
    }

    private function idColumnForType(string $type): string {
        return strtolower($type) === self::TYPE_FIN
            ? 'id_creneau_fin'
            : 'id_creneau_debut';
    }

    private function normalizeTime(string $time): string {
        $value = trim($time);
        if (preg_match('/^\d{2}:\d{2}$/', $value)) {
            return $value . ':00';
        }
        return $value;
    }

    public function getById(int $id, string $type = self::TYPE_DEBUT): ?array {
        $pdo = $this->db->getPdo();
        try {
            $table = $this->tableForType($type);
            $idCol = $this->idColumnForType($type);
            $stmt = $pdo->prepare("SELECT {$idCol} AS id_creneau, creneau FROM {$table} WHERE {$idCol} = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('TimeSlotModel::getById: ' . $e->getMessage());
            return null;
        }
    }

    public function getByTime(string $time, string $type = self::TYPE_DEBUT): ?array {
        $pdo = $this->db->getPdo();
        try {
            $normalized = $this->normalizeTime($time);
            $table = $this->tableForType($type);
            $idCol = $this->idColumnForType($type);
            $stmt = $pdo->prepare("SELECT {$idCol} AS id_creneau, creneau FROM {$table} WHERE creneau = :creneau");
            $stmt->execute([':creneau' => $normalized]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('TimeSlotModel::getByTime: ' . $e->getMessage());
            return null;
        }
    }

    public function resolveId($value, string $type = self::TYPE_DEBUT): ?int {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $row = $this->getById((int)$value, $type);
            return $row ? (int)$row['id_creneau'] : null;
        }

        $row = $this->getByTime((string)$value, $type);
        return $row ? (int)$row['id_creneau'] : null;
    }

    public function getAll(string $type = self::TYPE_DEBUT): array {
        $pdo = $this->db->getPdo();
        try {
            $table = $this->tableForType($type);
            $idCol = $this->idColumnForType($type);
            $stmt = $pdo->query("SELECT {$idCol} AS id_creneau, creneau FROM {$table} ORDER BY creneau");
            return $stmt ? ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
        } catch (Exception $e) {
            error_log('TimeSlotModel::getAll: ' . $e->getMessage());
            return [];
        }
    }

    public function getAllGrouped(): array {
        return [
            'debut' => $this->getAll(self::TYPE_DEBUT),
            'fin' => $this->getAll(self::TYPE_FIN),
        ];
    }

    public function addSlot(string $type, string $time): bool {
        $pdo = $this->db->getPdo();
        $table = $this->tableForType($type);
        $normalized = $this->normalizeTime($time);

        try {
            $stmt = $pdo->prepare("INSERT INTO {$table} (creneau) VALUES (:creneau)");
            $stmt->execute([':creneau' => $normalized]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('TimeSlotModel::addSlot: ' . $e->getMessage());
            return false;
        }
    }

    public function updateSlot(string $type, int $id, string $time): bool {
        $pdo = $this->db->getPdo();
        $table = $this->tableForType($type);
        $idCol = $this->idColumnForType($type);
        $normalized = $this->normalizeTime($time);

        try {
            $stmt = $pdo->prepare("UPDATE {$table} SET creneau = :creneau WHERE {$idCol} = :id");
            $stmt->execute([':creneau' => $normalized, ':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('TimeSlotModel::updateSlot: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteSlot(string $type, int $id): bool {
        $pdo = $this->db->getPdo();
        $table = $this->tableForType($type);
        $idCol = $this->idColumnForType($type);

        try {
            $stmt = $pdo->prepare("DELETE FROM {$table} WHERE {$idCol} = :id");
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('TimeSlotModel::deleteSlot: ' . $e->getMessage());
            return false;
        }
    }

    public function getScheduleByClassAndDay(int $classId, string $dayLower): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare(
                "SELECT hc.id_classe, hc.id_matiere, hc.id_creneau_debut, hc.id_creneau_fin,
                                                hc.id_local,
                                                                                                hc.id_professeur,
                        cd.creneau AS heure_debut, cf.creneau AS heure_fin,
                                                m.matiere, l.local, hc.jour_semaine
                 FROM horaires_cours hc
                 LEFT JOIN creneau_horaire_debut cd ON hc.id_creneau_debut = cd.id_creneau_debut
                 LEFT JOIN creneau_horaire_fin cf ON hc.id_creneau_fin = cf.id_creneau_fin
                 LEFT JOIN matieres m ON hc.id_matiere = m.id_matiere
                                 LEFT JOIN locaux l ON hc.id_local = l.id_local
                 WHERE hc.id_classe = :classe_id
                   AND LOWER(hc.jour_semaine) = :jour
                 ORDER BY cd.creneau"
            );
            $stmt->execute([
                ':classe_id' => $classId,
                ':jour' => $dayLower,
            ]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            error_log('TimeSlotModel::getScheduleByClassAndDay: ' . $e->getMessage());
            return [];
        }
    }

    public function getAllSchedulesWithTimeSlots(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query(
                "SELECT hc.*, l.local, cd.creneau AS heure_debut, cf.creneau AS heure_fin, m.matiere, p.nom AS professeur_nom, p.prenom AS professeur_prenom, p.username AS professeur_username
                 FROM horaires_cours hc
                 LEFT JOIN creneau_horaire_debut cd ON hc.id_creneau_debut = cd.id_creneau_debut
                 LEFT JOIN creneau_horaire_fin cf ON hc.id_creneau_fin = cf.id_creneau_fin
                 LEFT JOIN matieres m ON hc.id_matiere = m.id_matiere
                 LEFT JOIN locaux l ON hc.id_local = l.id_local
                 LEFT JOIN professeurs p ON hc.id_professeur = p.id_professeur
                 ORDER BY hc.id_classe, hc.jour_semaine, cd.creneau"
            );
            return $stmt ? ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
        } catch (Exception $e) {
            error_log('TimeSlotModel::getAllSchedulesWithTimeSlots: ' . $e->getMessage());
            return [];
        }
    }
}

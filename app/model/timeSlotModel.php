<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class TimeSlotModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    private function normalizeTime(string $time): string {
        $value = trim($time);
        if (preg_match('/^\d{2}:\d{2}$/', $value)) {
            return $value . ':00';
        }
        return $value;
    }

    public function getById(int $id): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT id_creneau, creneau FROM creneau_horaire WHERE id_creneau = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('TimeSlotModel::getById: ' . $e->getMessage());
            return null;
        }
    }

    public function getByTime(string $time): ?array {
        $pdo = $this->db->getPdo();
        try {
            $normalized = $this->normalizeTime($time);
            $stmt = $pdo->prepare("SELECT id_creneau, creneau FROM creneau_horaire WHERE creneau = :creneau");
            $stmt->execute([':creneau' => $normalized]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('TimeSlotModel::getByTime: ' . $e->getMessage());
            return null;
        }
    }

    public function resolveId($value): ?int {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $row = $this->getById((int)$value);
            return $row ? (int)$row['id_creneau'] : null;
        }

        $row = $this->getByTime((string)$value);
        return $row ? (int)$row['id_creneau'] : null;
    }

    public function getAll(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query("SELECT id_creneau, creneau FROM creneau_horaire ORDER BY creneau");
            return $stmt ? ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
        } catch (Exception $e) {
            error_log('TimeSlotModel::getAll: ' . $e->getMessage());
            return [];
        }
    }

    public function getScheduleByClassAndDay(int $classId, string $dayLower): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare(
                "SELECT hc.id_classe, hc.id_matiere, hc.id_creneau_debut, hc.id_creneau_fin,
                        cd.creneau AS heure_debut, cf.creneau AS heure_fin,
                        m.matiere, hc.salle, hc.jour_semaine
                 FROM horaires_cours hc
                 LEFT JOIN creneau_horaire cd ON hc.id_creneau_debut = cd.id_creneau
                 LEFT JOIN creneau_horaire cf ON hc.id_creneau_fin = cf.id_creneau
                 LEFT JOIN matieres m ON hc.id_matiere = m.id_matiere
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
                "SELECT hc.*, cd.creneau AS heure_debut, cf.creneau AS heure_fin, m.matiere
                 FROM horaires_cours hc
                 LEFT JOIN creneau_horaire cd ON hc.id_creneau_debut = cd.id_creneau
                 LEFT JOIN creneau_horaire cf ON hc.id_creneau_fin = cf.id_creneau
                 LEFT JOIN matieres m ON hc.id_matiere = m.id_matiere
                 ORDER BY hc.id_classe, hc.jour_semaine, cd.creneau"
            );
            return $stmt ? ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
        } catch (Exception $e) {
            error_log('TimeSlotModel::getAllSchedulesWithTimeSlots: ' . $e->getMessage());
            return [];
        }
    }
}

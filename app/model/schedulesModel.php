<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class SchedulesModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    public function getScheduleByClassAndDay(string $classe, string $jour): array {
        $pdo = $this->db->getPdo();

        // Normaliser le jour pour comparer avec différents formats
        $jourSql = strtolower($jour);

        $stmt = $pdo->prepare(
            "SELECT matiere, heure_debut, heure_fin, salle, jour_semaine
             FROM horaires_cours
             WHERE nom_classe = :classe
               AND LOWER(jour_semaine) = :jour
             ORDER BY heure_debut"
        );

        $stmt->execute([
            ':classe' => $classe,
            ':jour' => $jourSql
        ]);

        $schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($schedule)) {
            // Si pas de résultat avec jour exact, essaye versions anglaises/françaises
            $jourConverti = $this->convertDayToFrench($jourSql);
            if ($jourConverti && $jourConverti !== $jourSql) {
                $stmt->execute([':classe' => $classe, ':jour' => $jourConverti]);
                $schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }

        return $schedule;
    }

    private function convertDayToFrench(string $jour): string {
        $mapping = [
            'monday' => 'lundi', 'tuesday' => 'mardi', 'wednesday' => 'mercredi',
            'thursday' => 'jeudi', 'friday' => 'vendredi', 'saturday' => 'samedi',
            'sunday' => 'dimanche', 'lundi' => 'lundi', 'mardi' => 'mardi',
            'mercredi' => 'mercredi', 'jeudi' => 'jeudi', 'vendredi' => 'vendredi',
            'samedi' => 'samedi', 'dimanche' => 'dimanche'
        ];
        return $mapping[$jour] ?? $jour;
    }

    public function getAllSchedules(): array {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query(
            "SELECT * FROM horaires_cours ORDER BY nom_classe, jour_semaine, heure_debut"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addSchedule(array $data): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            "INSERT INTO horaires_cours (nom_classe, matiere, jour_semaine, heure_debut, heure_fin, salle)
             VALUES (:nom_classe, :matiere, :jour_semaine, :heure_debut, :heure_fin, :salle)"
        );
        try {
            $stmt->execute([
                ':nom_classe'   => $data['nom_classe']   ?? '',
                ':matiere'      => $data['matiere']      ?? '',
                ':jour_semaine' => $data['jour_semaine'] ?? '',
                ':heure_debut'  => $data['heure_debut']  ?? '',
                ':heure_fin'    => $data['heure_fin']    ?? '',
                ':salle'        => $data['salle']        ?? null,
            ]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log('addSchedule: ' . $e->getMessage());
            return false;
        }
    }

    public function updateSchedule(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id' => $id];
        foreach (['nom_classe', 'matiere', 'jour_semaine', 'heure_debut', 'heure_fin', 'salle'] as $field) {
            if (array_key_exists($field, $data)) {
                $setClauses[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        if (empty($setClauses)) return false;
        $stmt = $pdo->prepare(
            "UPDATE horaires_cours SET " . implode(', ', $setClauses) . " WHERE id = :id"
        );
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function deleteSchedule(int $id): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM horaires_cours WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }
}

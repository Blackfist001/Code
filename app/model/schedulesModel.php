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
            'monday' => 'lundi',
            'tuesday' => 'mardi',
            'wednesday' => 'mercredi',
            'thursday' => 'jeudi',
            'friday' => 'vendredi',
            'saturday' => 'samedi',
            'sunday' => 'dimanche',
            'lundi' => 'lundi',
            'mardi' => 'mardi',
            'mercredi' => 'mercredi',
            'jeudi' => 'jeudi',
            'vendredi' => 'vendredi',
            'samedi' => 'samedi',
            'dimanche' => 'dimanche'
        ];

        return $mapping[$jour] ?? $jour;
    }
}

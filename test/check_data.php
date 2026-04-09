<?php
require_once 'vendor/autoload.php';
require_once 'app/core/dataBase.php';
require_once 'app/config/config.php';

try {
    $db = new App\Core\DataBase();
    $pdo = $db->getPdo();

    echo "=== DONNÉES UTILISATEURS ===\n";
    $stmt = $pdo->query("SELECT id_user, nom, role FROM utilisateurs");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as $user) {
        echo "- ID: {$user['id_user']}, Nom: {$user['nom']}, Rôle: {$user['role']}\n";
    }

    echo "\n=== DONNÉES ÉTUDIANTS (premiers 5) ===\n";
    $stmt = $pdo->query("
        SELECT e.id_etudiant, e.sourcedId, e.nom, e.prenom, c.classe as classe
        FROM etudiants e
        LEFT JOIN classes c ON e.classe = c.id_classe
        LIMIT 5
    ");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($students as $student) {
        echo "- ID: {$student['id_etudiant']}, SourceID: {$student['sourcedId']}, Nom: {$student['nom']} {$student['prenom']}, Classe: {$student['classe']}\n";
    }

    echo "\n=== STATISTIQUES ===\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total_students FROM etudiants");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total étudiants: {$stats['total_students']}\n";

    $stmt = $pdo->query("SELECT COUNT(*) as total_movements FROM passages");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total mouvements: {$stats['total_movements']}\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?></content>
<parameter name="filePath">c:\ProgsCodes\#ECI\Stage\test\Code\check_data.php
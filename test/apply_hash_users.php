<?php
require_once 'vendor/autoload.php';
require_once 'app/core/dataBase.php';

try {
    $db = new App\Core\DataBase();
    $pdo = $db->getPdo();
    
    $stmt = $pdo->query("SELECT id_user, nom, mot_de_passe FROM utilisateurs");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as $user) {
        $id = $user['id_user'];
        $current = $user['mot_de_passe'];

        if (strpos($current, '$2y$') === 0 || strpos($current, '$argon2') === 0) {
            echo "user {$user['nom']} déjà hashé\n";
            continue;
        }

        $hashed = password_hash($current, PASSWORD_DEFAULT);
        $update = $pdo->prepare("UPDATE utilisateurs SET mot_de_passe = :pass WHERE id_user = :id");
        $update->execute([':pass' => $hashed, ':id' => $id]);
        echo "user {$user['nom']} hashé\n";
    }

    echo "Terminé\n";
} catch (Exception $e) {
    echo 'Erreur: ' . $e->getMessage() . "\n";
}
?>
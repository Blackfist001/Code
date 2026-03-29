<?php
require_once 'vendor/autoload.php';
require_once 'app/core/dataBase.php';

try {
    $db = new App\Core\DataBase();
    $pdo = $db->getPdo();

    // Lire le hash du compte edu
    $stmt = $pdo->prepare("SELECT id_user, nom, mot_de_passe FROM utilisateurs WHERE nom = :username");
    $stmt->execute([':username' => 'edu']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('Utilisateur edu introuvable en base');
    }

    echo "Utilisateur trouvé: id={$user['id_user']}, nom={$user['nom']}\n";
    echo "Hash stocké: {$user['mot_de_passe']}\n";

    $password = 'edu';
    $verify = password_verify($password, $user['mot_de_passe']) ? 'OK' : 'KO';

    echo "Vérification password_verify('edu'): {$verify}\n";

} catch (Exception $e) {
    echo 'Erreur: ' . $e->getMessage() . "\n";
}
?>
<?php
require_once 'vendor/autoload.php';
require_once 'app/core/dataBase.php';
require_once 'app/config/config.php';

try {
    $db = new App\Core\DataBase();
    $pdo = $db->getPdo();

    echo "=== COMMANDES SQL POUR HASHER LES MOTS DE PASSE ===\n\n";

    // Récupérer tous les utilisateurs
    $stmt = $pdo->query("SELECT id_user, nom, mot_de_passe FROM utilisateurs");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as $user) {
        $id = $user['id_user'];
        $username = $user['nom'];
        $plainPassword = $user['mot_de_passe'];

        // Hasher le mot de passe
        $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

        // Afficher la commande SQL
        echo "-- Utilisateur: {$username} (ID: {$id})\n";
        echo "-- Mot de passe en clair: {$plainPassword}\n";
        echo "UPDATE utilisateurs SET mot_de_passe = '{$hashedPassword}' WHERE id_user = {$id};\n\n";
    }

    echo "=== INSTRUCTIONS ===\n";
    echo "1. Copiez et exécutez ces commandes SQL dans votre base de données\n";
    echo "2. Ensuite, modifiez la méthode authenticate() dans usersModel.php pour utiliser password_verify()\n";
    echo "3. Les connexions fonctionneront alors avec les mots de passe hashés de manière sécurisée\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?></content>
<parameter name="filePath">c:\ProgsCodes\#ECI\Stage\test\Code\hash_passwords.php
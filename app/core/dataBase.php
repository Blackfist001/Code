<?php
namespace App\Core;

// test si la classe DataBase n'existe pas déjà
if (!class_exists('DataBase')) {
	/**
	 * Encapsule la connexion PDO et fournit l'instance \PDO configurée à partir de config.php.
	 */
	class DataBase {
		private \PDO $pdo;

		/**
		 * Initialise la connexion PDO à partir de la configuration.
		 *
		 * @throws \PDOException si la connexion à la base de données échoue
		 */
		public function __construct() {
			// Lire la configuration depuis le fichier config.php
			$config = require __DIR__ . '/../config/config.php';
			$dsn = $config['dsn'] ?? '';
			$user = $config['user'] ?? '';
			$pass = $config['pass'] ?? '';

			// S'assurer que le log SQL écrit dans le même fichier que PHP
			$logFile = __DIR__ . '/../logs/php_errors.log';
			ini_set('error_log', $logFile);

			try {
				$this->pdo = new \PDO($dsn, $user, $pass);
				$this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
			} catch (\PDOException $e) {
				error_log('[SQL] PDO connection error: ' . $e->getMessage());

				$code = (string)$e->getCode();
				$message = (string)$e->getMessage();
				if ($code === '2054' || stripos($message, 'auth_gssapi_client') !== false) {
					error_log('[SQL] Authentication plugin mismatch detected. ' .
						'Le serveur MySQL demande auth_gssapi_client, non supporte par ce client PDO. ' .
						'Verifiez DB_USER/DB_PASS charges en production (fichier .env ou variables IIS) et utilisez un utilisateur MySQL avec mysql_native_password (ou un plugin supporte par le driver PHP).');
				}

				throw $e;
			}
		}

		/**
		 * Retourne l'instance PDO configurée.
		 *
		 * @return \PDO
		 */
		public function getPdo(): \PDO {
			return $this->pdo;
		}
	}
}
?>
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
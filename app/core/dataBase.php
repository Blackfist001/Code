<?php
namespace App\Core;

// test si la classe DataBase n'existe pas déjà
if (!class_exists('DataBase')) {
	class DataBase {
		private \PDO $pdo;

		public function __construct() {
			// Lire la configuration depuis le fichier config.php
			$config = require __DIR__ . '../config/config.php';
			$dsn = $config['dsn'] ?? '';
			$user = $config['user'] ?? '';
			$pass = $config['pass'] ?? '';

			try {
				$this->pdo = new \PDO($dsn, $user, $pass);
				$this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
			} catch (\PDOException $e) {
				error_log('PDO connection error: ' . $e->getMessage());
				throw $e;
			}
		}

		public function getPdo(): \PDO {
			return $this->pdo;
		}
	}
}
?>
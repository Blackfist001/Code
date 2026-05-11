<?php
namespace App\Service;

use Exception;

/**
 * Service de validation des entrées utilisateur
 * Prévient les injections, DoS et autres attaques par entrée malveillante
 */
class ValidationService {
    
    /**
     * Valide une chaîne de caractères (longueur, type)
     *
     * @param mixed $value Valeur à valider
     * @param int $minLen Longueur minimale (défaut: 0)
     * @param int $maxLen Longueur maximale (défaut: 255)
     * @return bool True si valide
     */
    public static function validateString($value, $minLen = 0, $maxLen = 255): bool {
        if (!is_string($value)) {
            return false;
        }
        $len = mb_strlen($value);
        return $len >= $minLen && $len <= $maxLen;
    }

    /**
     * Valide une date au format Y-m-d
     *
     * @param mixed $date Date à valider
     * @param string $format Format attendu (défaut: 'Y-m-d')
     * @return bool True si valide
     */
    public static function validateDate($date, $format = 'Y-m-d'): bool {
        if (!is_string($date)) {
            return false;
        }
        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    /**
     * Valide un email
     *
     * @param mixed $email Email à valider
     * @return bool True si valide
     */
    public static function validateEmail($email): bool {
        if (!is_string($email)) {
            return false;
        }
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Valide un UUID v4
     *
     * @param mixed $uuid UUID à valider
     * @return bool True si valide
     */
    public static function validateUUID($uuid): bool {
        if (!is_string($uuid)) {
            return false;
        }
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid) === 1;
    }

    /**
     * Valide un UUID (tous les formats, pas seulement v4)
     *
     * @param mixed $uuid UUID à valider
     * @return bool True si valide
     */
    public static function validateUUIDGeneric($uuid): bool {
        if (!is_string($uuid)) {
            return false;
        }
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid) === 1;
    }

    /**
     * Valide un identifiant numérique
     *
     * @param mixed $id ID à valider
     * @return bool True si valide
     */
    public static function validateId($id): bool {
        if (!is_numeric($id)) {
            return false;
        }
        $intId = (int)$id;
        return $intId > 0;
    }

    /**
     * Nettoie et valide une requête de recherche
     *
     * @param string $query Requête utilisateur
     * @param int $minLen Longueur minimale (défaut: 1)
     * @param int $maxLen Longueur maximale (défaut: 100)
     * @return string Requête nettoyée
     * @throws Exception Si validation échoue
     */
    public static function sanitizeSearch($query, $minLen = 1, $maxLen = 100): string {
        if (!is_string($query)) {
            throw new Exception('Recherche invalide: non une chaîne');
        }
        
        $q = trim($query);
        $len = mb_strlen($q);
        
        if ($len < $minLen) {
            throw new Exception("Recherche trop courte (min: $minLen caractères)");
        }
        if ($len > $maxLen) {
            throw new Exception("Recherche trop longue (max: $maxLen caractères)");
        }
        
        // Pas d'échappement ici - sera fait par le modèle avec prepare()
        return $q;
    }

    /**
     * Valide un nom d'utilisateur
     *
     * @param mixed $username Nom d'utilisateur
     * @param int $minLen Longueur minimale (défaut: 3)
     * @param int $maxLen Longueur maximale (défaut: 50)
     * @return bool True si valide
     */
    public static function validateUsername($username, $minLen = 3, $maxLen = 50): bool {
        if (!is_string($username)) {
            return false;
        }
        
        $len = mb_strlen($username);
        if ($len < $minLen || $len > $maxLen) {
            return false;
        }
        
        // Autorise alphanumérique + quelques caractères spéciaux
        return preg_match('/^[a-zA-Z0-9._-]+$/', $username) === 1;
    }

    /**
     * Valide un mot de passe (longueur minimale)
     *
     * @param mixed $password Mot de passe
     * @param int $minLen Longueur minimale (défaut: 8)
     * @param int $maxLen Longueur maximale (défaut: 128)
     * @return bool True si valide
     */
    public static function validatePassword($password, $minLen = 8, $maxLen = 128): bool {
        if (!is_string($password)) {
            return false;
        }
        
        $len = mb_strlen($password);
        return $len >= $minLen && $len <= $maxLen;
    }

    /**
     * Valide un rôle utilisateur (whitelist)
     *
     * @param mixed $role Rôle à valider
     * @param array $allowedRoles Rôles autorisés
     * @return bool True si valide
     */
    public static function validateRole($role, $allowedRoles = ['Administrateur', 'Gestionnaire', 'Surveillant']): bool {
        if (!is_string($role)) {
            return false;
        }
        return in_array($role, $allowedRoles, true);
    }

    /**
     * Valide un identifiant de classe (numérique)
     *
     * @param mixed $classId ID de classe
     * @return bool True si valide
     */
    public static function validateClassId($classId): bool {
        return self::validateId($classId);
    }

    /**
     * Valide un identifiant d'étudiant (numérique)
     *
     * @param mixed $studentId ID d'étudiant
     * @return bool True si valide
     */
    public static function validateStudentId($studentId): bool {
        return self::validateId($studentId);
    }

    /**
     * Valide un type de passage (whitelist)
     *
     * @param mixed $type Type de passage
     * @return bool True si valide
     */
    public static function validatePassageType($type, $allowedTypes = ['entree_matin', 'sortie_midi', 'retour_midi', 'sortie_autorisee']): bool {
        if (!is_string($type)) {
            return false;
        }
        return in_array($type, $allowedTypes, true);
    }

    /**
     * Valide un statut de passage (whitelist)
     *
     * @param mixed $statut Statut du passage
     * @return bool True si valide
     */
    public static function validatePassageStatus($statut, $allowedStatus = ['Autorisé', 'Absent', 'Absence justifiée']): bool {
        if (!is_string($statut)) {
            return false;
        }
        return in_array($statut, $allowedStatus, true);
    }
}
?>

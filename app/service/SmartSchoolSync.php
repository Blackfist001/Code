<?php
namespace App\Service;

use App\Model\StudentsModel;
use Exception;
use RuntimeException;

/**
 * SmartSchoolSync
 *
 * Service de synchronisation des données étudiants depuis l'API SmartSchool
 * via le protocole OAuth 2.0 (Client Credentials).
 *
 * Utilisation prévue :
 *   $sync = new SmartSchoolSync();
 *   $sync->syncStudents();
 *
 * Prérequis :
 *  - Configurer app/config/smartschool.php avec les bonnes URLs
 *  - Extension PHP cURL activée
 */
class SmartSchoolSync {

    private array  $config;
    private string $accessToken = '';

    /** Regex de validation des sourcedId étudiants SmartSchool */
    public const SOURCED_ID_REGEX =
        '/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/';

    public function __construct() {
        $this->config = require __DIR__ . '/../config/smartschool.php';
    }

    // -------------------------------------------------------------------------
    // Point d'entrée principal
    // -------------------------------------------------------------------------

    /**
     * Lance la synchronisation complète des étudiants.
     * Pour chaque étudiant retourné par SmartSchool :
     *  - Valide le sourcedId
     *  - Insère ou met à jour l'enregistrement en base
     *
     * @return array  ['inserted' => int, 'updated' => int, 'skipped' => int]
     * @throws RuntimeException  Si l'authentification ou la récupération échoue
     */
    public function syncStudents(): array {
        $this->authenticate();

        $students = $this->fetchStudents();
        $studentsModel = new StudentsModel();

        $stats = ['inserted' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($students as $raw) {
            $sourcedId = $raw['sourcedId'] ?? '';

            // Validation du format sourcedId
            if (!self::validateSourcedId($sourcedId)) {
                error_log("[SmartSchoolSync] sourcedId invalide ignoré : {$sourcedId}");
                $stats['skipped']++;
                continue;
            }

            $studentData = $this->mapStudentData($raw);
            $existing    = $studentsModel->getStudentBySourcedId($sourcedId);

            if ($existing) {
                $studentsModel->updateStudentBySourcedId($sourcedId, $studentData);
                $stats['updated']++;
            } else {
                $studentsModel->createStudent($studentData);
                $stats['inserted']++;
            }
        }

        return $stats;
    }

    // -------------------------------------------------------------------------
    // Authentification OAuth
    // -------------------------------------------------------------------------

    /**
     * Obtient un access token via OAuth 2.0 Client Credentials.
     *
     * @throws RuntimeException
     */
    private function authenticate(): void {
        $payload = http_build_query([
            'grant_type'    => 'client_credentials',
            'client_id'     => $this->config['client_id'],
            'client_secret' => $this->config['client_secret'],
            'scope'         => implode(' ', $this->config['scopes']),
        ]);

        $response = $this->httpPost($this->config['token_url'], $payload, [
            'Content-Type: application/x-www-form-urlencoded',
        ]);

        if (empty($response['access_token'])) {
            throw new RuntimeException('[SmartSchoolSync] Authentification OAuth échouée : ' .
                ($response['error_description'] ?? 'réponse inattendue'));
        }

        $this->accessToken = $response['access_token'];
    }

    // -------------------------------------------------------------------------
    // Récupération des données
    // -------------------------------------------------------------------------

    /**
     * Récupère la liste complète des étudiants depuis l'API SmartSchool.
     *
     * @return array  Tableau de données brutes étudiants
     * @throws RuntimeException
     */
    private function fetchStudents(): array {
        $url      = rtrim($this->config['api_url'], '/') . '/students';
        $response = $this->httpGet($url);

        if (!isset($response['data'])) {
            throw new RuntimeException('[SmartSchoolSync] Réponse API inattendue (clé "data" absente)');
        }

        return $response['data'];
    }

    // -------------------------------------------------------------------------
    // Mapping des données
    // -------------------------------------------------------------------------

    /**
     * Transforme un enregistrement brut SmartSchool en tableau attendu par StudentsModel.
     */
    private function mapStudentData(array $raw): array {
        return [
            'sourcedId'         => $raw['sourcedId']        ?? null,
            'nom'               => $raw['familyName']        ?? null,
            'prenom'            => $raw['givenName']         ?? null,
            'classe'            => $raw['orgUnit']           ?? null,
            'date_naissance'    => $raw['dateOfBirth']       ?? null,
            'autorisation_midi' => 0,   // valeur par défaut — à gérer manuellement
        ];
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * Valide le format d'un sourcedId SmartSchool.
     * Format : 8-4-4-4-12 caractères alphanumériques séparés par des tirets.
     *
     * Exemples valides :
     *   a1b2c3d4-e5f6-7890-abcd-ef1234567890
     *   AABBCCDD-1122-3344-5566-778899AABBCC
     *
     * @param  string $sourcedId
     * @return bool
     */
    public static function validateSourcedId(string $sourcedId): bool {
        return (bool) preg_match(self::SOURCED_ID_REGEX, $sourcedId);
    }

    // -------------------------------------------------------------------------
    // Helpers HTTP (cURL)
    // -------------------------------------------------------------------------

    private function httpGet(string $url): array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->config['http_timeout'],
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->accessToken,
                'Accept: application/json',
            ],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body = curl_exec($ch);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new RuntimeException('[SmartSchoolSync] Erreur cURL GET : ' . $err);
        }

        return json_decode($body, true) ?? [];
    }

    private function httpPost(string $url, string $payload, array $headers = []): array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->config['http_timeout'],
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body = curl_exec($ch);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new RuntimeException('[SmartSchoolSync] Erreur cURL POST : ' . $err);
        }

        return json_decode($body, true) ?? [];
    }
}

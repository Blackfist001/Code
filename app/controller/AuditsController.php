<?php
namespace App\Controller;

use App\Service\AuditService;

class AuditsController {
    public function logins(): void {
        header('Content-Type: application/json');

        try {
            $rows = AuditService::getLogins(500);
            echo json_encode([
                'success' => true,
                'results' => $rows,
            ]);
        } catch (\Throwable $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function dbChanges(): void {
        header('Content-Type: application/json');

        try {
            $rows = AuditService::getDbChanges(1000);
            echo json_encode([
                'success' => true,
                'results' => $rows,
            ]);
        } catch (\Throwable $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }
}

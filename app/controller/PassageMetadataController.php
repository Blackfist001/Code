<?php
namespace App\Controller;

use App\Model\PassageMetadataModel;
use Exception;
use RuntimeException;

class PassageMetadataController {
    private $model;

    public function __construct() {
        $this->model = new PassageMetadataModel();
    }

    private function getKind(array $params): string {
        $kind = strtolower(trim((string)($params['kind'] ?? '')));
        if (!in_array($kind, ['types', 'statuses', 'reasons'], true)) {
            throw new RuntimeException('Type de métadonnée invalide.');
        }
        return $kind;
    }

    public function getAll($params = []): void {
        header('Content-Type: application/json');
        try {
            $kind = $this->getKind($params);
            $results = $this->model->getAll($kind);
            echo json_encode(['success' => true, 'results' => $results]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update($params = []): void {
        header('Content-Type: application/json');
        try {
            $kind = $this->getKind($params);
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            $label = (string)($input['label'] ?? '');
            if ($id <= 0) {
                throw new RuntimeException('ID requis.');
            }
            $this->model->updateLabel($kind, $id, $label);
            echo json_encode(['success' => true, 'message' => 'Valeur mise à jour.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function create($params = []): void {
        header('Content-Type: application/json');
        try {
            $kind = $this->getKind($params);
            $input = json_decode(file_get_contents('php://input'), true);
            $label = (string)($input['label'] ?? '');
            $this->model->create($kind, $label);
            echo json_encode(['success' => true, 'message' => 'Valeur ajoutée.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function delete($params = []): void {
        header('Content-Type: application/json');
        try {
            $kind = $this->getKind($params);
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                throw new RuntimeException('ID requis.');
            }
            $this->model->delete($kind, $id);
            echo json_encode(['success' => true, 'message' => 'Valeur supprimée.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}

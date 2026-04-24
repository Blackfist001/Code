<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class CourseModel {
    private DataBase $db;

    public function __construct() {
        $this->db = new DataBase();
    }

    private function teacherExists(int $teacherId): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("SELECT id_professeur FROM professeurs WHERE id_professeur = :id");
        $stmt->execute([':id' => $teacherId]);
        return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * @param mixed $raw
     * @return array<int,int>
     */
    private function normalizeTeacherIds($raw): array {
        if ($raw === null || $raw === '') {
            return [];
        }

        if (is_string($raw) && str_contains($raw, ',')) {
            $raw = array_map('trim', explode(',', $raw));
        }

        if (!is_array($raw)) {
            $raw = [$raw];
        }

        $result = [];
        foreach ($raw as $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $id = (int)$value;
            if ($id > 0) {
                $result[] = $id;
            }
        }

        $result = array_values(array_unique($result));
        sort($result);
        return $result;
    }

    /**
     * @param array<int,int> $teacherIds
     */
    private function validateTeacherIds(array $teacherIds): void {
        foreach ($teacherIds as $teacherId) {
            if (!$this->teacherExists($teacherId)) {
                throw new \RuntimeException('TEACHER_NOT_FOUND');
            }
        }
    }

    /**
     * @return array<int,array<int,array<string,mixed>>>
     */
    private function getTeachersByMatiereIds(array $matiereIds): array {
        if (empty($matiereIds)) {
            return [];
        }

        $pdo = $this->db->getPdo();
        $placeholders = implode(',', array_fill(0, count($matiereIds), '?'));

        $stmt = $pdo->prepare(
            "SELECT mp.id_matiere, p.id_professeur, p.nom, p.prenom, p.email, p.username
             FROM matieres_professeurs mp
             INNER JOIN professeurs p ON p.id_professeur = mp.id_professeur
             WHERE mp.id_matiere IN ($placeholders)
             ORDER BY p.nom, p.prenom"
        );

        $stmt->execute($matiereIds);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $map = [];
        foreach ($rows as $row) {
            $matiereId = (int)$row['id_matiere'];
            if (!isset($map[$matiereId])) {
                $map[$matiereId] = [];
            }
            $map[$matiereId][] = [
                'id_professeur' => (int)$row['id_professeur'],
                'nom' => $row['nom'] ?? null,
                'prenom' => $row['prenom'] ?? null,
                'email' => $row['email'] ?? null,
                'username' => $row['username'] ?? null,
            ];
        }

        return $map;
    }

    /**
     * @param array<int,array<string,mixed>> $matieres
     * @return array<int,array<string,mixed>>
     */
    private function attachTeachers(array $matieres): array {
        if (empty($matieres)) {
            return $matieres;
        }

        $matiereIds = array_map(static fn(array $m): int => (int)$m['id_matiere'], $matieres);
        $teachersMap = $this->getTeachersByMatiereIds($matiereIds);

        foreach ($matieres as &$matiere) {
            $id = (int)$matiere['id_matiere'];
            $teachers = $teachersMap[$id] ?? [];
            $matiere['professeurs'] = $teachers;
            $matiere['id_professeurs'] = array_map(
                static fn(array $t): int => (int)$t['id_professeur'],
                $teachers
            );
            $matiere['professeur_nom'] = $teachers[0]['nom'] ?? null;
            $matiere['professeur_prenom'] = $teachers[0]['prenom'] ?? null;
        }
        unset($matiere);

        return $matieres;
    }

    /**
     * @param array<int,int> $teacherIds
     */
    private function replaceMatiereTeachers(int $matiereId, array $teacherIds): void {
        $pdo = $this->db->getPdo();

        $delete = $pdo->prepare("DELETE FROM matieres_professeurs WHERE id_matiere = :id_matiere");
        $delete->execute([':id_matiere' => $matiereId]);

        if (empty($teacherIds)) {
            return;
        }

        $insert = $pdo->prepare(
            "INSERT INTO matieres_professeurs (id_matiere, id_professeur) VALUES (:id_matiere, :id_professeur)"
        );

        foreach ($teacherIds as $teacherId) {
            $insert->execute([
                ':id_matiere' => $matiereId,
                ':id_professeur' => $teacherId,
            ]);
        }
    }

    /**
     * Retourne toutes les matières triées alphabétiquement.
     *
     * @return array
     */
    public function getAllMatieres(): array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->query("SELECT m.* FROM matieres m ORDER BY m.matiere");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            return $this->attachTeachers($rows);
        } catch (Exception $e) {
            error_log('getAllMatieres: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Retourne une matière par son ID.
     *
     * @param int $id
     * @return array|null null si non trouvée
     */
    public function getMatiereById(int $id): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT m.* FROM matieres m WHERE m.id_matiere = :id");
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$result) {
                return null;
            }

            $withTeachers = $this->attachTeachers([$result]);
            return $withTeachers[0] ?? null;
        } catch (Exception $e) {
            error_log('getMatiereById: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Recherche une matière par son nom exact.
     *
     * @param string $name
     * @return array|null null si non trouvée
     */
    public function getMatiereByName(string $name): ?array {
        $pdo = $this->db->getPdo();
        try {
            $stmt = $pdo->prepare("SELECT * FROM matieres WHERE matiere = :matiere");
            $stmt->execute([':matiere' => $name]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (Exception $e) {
            error_log('getMatiereByName: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Insère une nouvelle matière.
     *
     * @param array $data Champs attendus : matiere (nom)
     * @return bool true si la ligne a été insérée
     * @throws \RuntimeException('DUPLICATE') si le nom est déjà utilisé
     */
    public function addMatiere(array $data): bool {
        $pdo = $this->db->getPdo();
        $matiere = trim($data['matiere'] ?? '');
        $teacherIds = [];

        if (array_key_exists('id_professeurs', $data)) {
            $teacherIds = $this->normalizeTeacherIds($data['id_professeurs']);
        } elseif (array_key_exists('id_professeur', $data)) {
            $teacherIds = $this->normalizeTeacherIds($data['id_professeur']);
        }

        if ($matiere === '') {
            return false;
        }

        try {
            $this->validateTeacherIds($teacherIds);

            if ($this->getMatiereByName($matiere)) {
                throw new \RuntimeException('DUPLICATE');
            }

            $stmt = $pdo->prepare("INSERT INTO matieres (matiere, description, active) VALUES (:matiere, :description, :active)");
            $stmt->execute([
                ':matiere'      => $matiere,
                ':description'  => $data['description'] ?? null,
                ':active'       => isset($data['active']) ? (int)(bool)$data['active'] : 1,
            ]);

            $matiereId = (int)$pdo->lastInsertId();
            $this->replaceMatiereTeachers($matiereId, $teacherIds);
            return $matiereId > 0;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            error_log('addMatiere: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Met à jour le nom d'une matière.
     *
     * @param int   $id
     * @param array $data Champs attendus : matiere (nouveau nom)
     * @return bool true si la ligne a été modifiée
     * @throws \RuntimeException('DUPLICATE') si le nouveau nom est déjà utilisé par une autre matière
     */
    public function updateMatiere(int $id, array $data): bool {
        $pdo = $this->db->getPdo();
        $matiere = isset($data['matiere']) ? trim((string)$data['matiere']) : null;
        $hasTeacherPayload = array_key_exists('id_professeurs', $data) || array_key_exists('id_professeur', $data);
        $teacherIds = [];

        if (array_key_exists('id_professeurs', $data)) {
            $teacherIds = $this->normalizeTeacherIds($data['id_professeurs']);
        } elseif (array_key_exists('id_professeur', $data)) {
            $teacherIds = $this->normalizeTeacherIds($data['id_professeur']);
        }

        try {
            $updatedRow = false;

            if ($matiere !== null) {
                if ($matiere === '') {
                    return false;
                }

                $existing = $this->getMatiereByName($matiere);
                if ($existing && (int)$existing['id_matiere'] !== $id) {
                    throw new \RuntimeException('DUPLICATE');
                }

                $stmt = $pdo->prepare("UPDATE matieres SET matiere = :matiere WHERE id_matiere = :id");
                $stmt->execute([
                    ':matiere' => $matiere,
                    ':id' => $id,
                ]);
                $updatedRow = $updatedRow || ($stmt->rowCount() > 0);
            }

            if (array_key_exists('description', $data) || array_key_exists('active', $data)) {
                $sets = [];
                $params = [':id' => $id];
                if (array_key_exists('description', $data)) {
                    $sets[] = 'description = :description';
                    $params[':description'] = $data['description'];
                }
                if (array_key_exists('active', $data)) {
                    $sets[] = 'active = :active';
                    $params[':active'] = (int)(bool)$data['active'];
                }
                $stmt = $pdo->prepare("UPDATE matieres SET " . implode(', ', $sets) . " WHERE id_matiere = :id");
                $stmt->execute($params);
                $updatedRow = $updatedRow || ($stmt->rowCount() > 0);
            }

            if ($hasTeacherPayload) {
                $this->validateTeacherIds($teacherIds);
                $this->replaceMatiereTeachers($id, $teacherIds);
                $updatedRow = true;
            }

            if ($matiere === null && !$hasTeacherPayload) {
                return false;
            }

            return $updatedRow;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            error_log('updateMatiere: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprime une matière par son ID.
     *
     * @param int $id
     * @return bool true si la ligne a été supprimée
     * @throws \RuntimeException('USED_IN_SCHEDULES') si la matière est référencée dans des horaires
     */
    public function deleteMatiere(int $id): bool {
        $pdo = $this->db->getPdo();

        try {
            $check = $pdo->prepare("SELECT COUNT(*) AS count FROM horaires_cours WHERE id_matiere = :id_matiere");
            $check->execute([':id_matiere' => $id]);
            $used = $check->fetch(PDO::FETCH_ASSOC);
            if (($used['count'] ?? 0) > 0) {
                throw new \RuntimeException('USED_IN_SCHEDULES');
            }

            $stmt = $pdo->prepare("DELETE FROM matieres WHERE id_matiere = :id");
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (\RuntimeException $e) {
            throw $e;
        } catch (Exception $e) {
            error_log('deleteMatiere: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Recherche des matières selon des filtres optionnels (id, matiere en LIKE, id_professeur).
     *
     * @param array $filters Clés : id, matiere, id_professeur
     * @return array
     */
    public function searchMatieres(array $filters): array {
        $pdo = $this->db->getPdo();
        $conditions = [];
        $params = [];

        if (!empty($filters['id'])) {
            $conditions[] = "m.id_matiere = :id";
            $params[':id'] = $filters['id'];
        }

        if (!empty($filters['matiere'])) {
            $conditions[] = "m.matiere LIKE :matiere";
            $params[':matiere'] = '%' . $filters['matiere'] . '%';
        }

        if (!empty($filters['id_professeur'])) {
            $conditions[] = "EXISTS (
                SELECT 1 FROM matieres_professeurs mp
                WHERE mp.id_matiere = m.id_matiere
                  AND mp.id_professeur = :id_professeur
            )";
            $params[':id_professeur'] = (int)$filters['id_professeur'];
        }

        $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

        try {
            $stmt = $pdo->prepare("SELECT m.* FROM matieres m $whereClause ORDER BY m.matiere");
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            return $this->attachTeachers($rows);
        } catch (Exception $e) {
            error_log('searchMatieres: ' . $e->getMessage());
            return [];
        }
    }
}

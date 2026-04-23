/**
 * Sous-contrôleur de gestion des passages.
 */
export default class ManagementPassagesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge tous les passages et les affiche.
     * @returns {Promise<void>}
     */
    async loadPassages() {
        try {
            const response = await this.api.searchMovementsByStudent({});
            this.parent.view.displayPassages(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadPassages:', error);
            this.parent.view.displayPassages([]);
        }
    }

    /**
     * Charge les passages filtrés par plage de dates.
     * @param {string} dateFrom - Date de début (Y-m-d)
     * @param {string} dateTo   - Date de fin (Y-m-d)
     * @returns {Promise<void>}
     */
    async loadPassagesByDateRange(dateFrom, dateTo) {
        try {
            const response = await this.api.searchMovementsByStudent({ date_from: dateFrom, date_to: dateTo });
            this.parent.view.displayPassages(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadPassagesByDateRange:', error);
            this.parent.view.displayPassages([]);
        }
    }

    /**
     * Ajoute un passage manuel.
     * @param {Object} data - Champs du formulaire (id_etudiant obligatoire)
     * @returns {Promise<void>}
     */
    async addPassage(data) {
        if (!data.id_etudiant) {
            alert('Veuillez sélectionner un étudiant');
            return;
        }

        try {
            const movementData = {
                id_etudiant: data.id_etudiant,
                type_passage: data.type_passage || 'Entrée matin',
                statut: 'Autorisé',
                date_passage: data.date_passage || new Date().toISOString().split('T')[0],
                heure_passage: data.heure_passage || new Date().toTimeString().split(' ')[0],
                scan: false,
                manualEncoding: true,
            };

            const response = await this.api.addMovement(movementData);
            if (response.success) {
                await this.loadPassages();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout du passage');
            }
        } catch (error) {
            console.error('Erreur addPassage:', error);
        }
    }

    /**
     * Déclenche l'export CSV des passages pour la période donnée.
     * @param {string} dateFrom - Date de début (Y-m-d)
     * @param {string} dateTo   - Date de fin (Y-m-d)
     */
    exportPassagesCSV(dateFrom, dateTo) {
        try {
            const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
            const url = `/api/export/csv?${params.toString()}`;
            window.location.assign(url);
        } catch (error) {
            console.error('Erreur exportPassagesCSV:', error);
        }
    }

    /**
     * Met à jour un passage existant.
     * @param {number|string} id - ID du passage
     * @param {Object} data      - Champs à modifier
     * @returns {Promise<void>}
     */
    async updatePassage(id, data) {
        try {
            const response = await this.api.updateMovement(id, data);
            if (response.success) {
                await this.loadPassages();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updatePassage:', error);
        }
    }

    /**
     * Supprime un passage par son ID.
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    async deletePassage(id) {
        try {
            const response = await this.api.deleteMovement(id);
            if (response.success) {
                await this.loadPassages();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deletePassage:', error);
        }
    }
}

/**
 * Sous-contrôleur de gestion des matières.
 */
export default class ManagementMatieresController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge et affiche la liste des matières.
     * @returns {Promise<void>}
     */
    async loadMatieres() {
        try {
            const response = await this.api.getAllMatieres();
            const matieres = response.success ? response.results : [];
            this.parent.view.setScheduleMatieres(matieres);
            this.parent.view.displayMatieres(matieres);
        } catch (error) {
            console.error('Erreur loadMatieres:', error);
            this.parent.view.setScheduleMatieres([]);
            this.parent.view.displayMatieres([]);
        }
    }

    /**
     * Ajoute une matière après validation du nom.
     * @param {{matiere: string}} data
     * @returns {Promise<void>}
     */
    async addMatiere(data) {
        if (!data.matiere || !data.matiere.trim()) {
            alert('Veuillez saisir une matière');
            return;
        }

        try {
            const response = await this.api.addMatiere({ matiere: data.matiere.trim() });
            if (response.success) {
                await this.loadMatieres();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur addMatiere:', error);
        }
    }

    /**
     * Met à jour le nom d'une matière.
     * @param {number|string} id
     * @param {{matiere: string}} data
     * @returns {Promise<void>}
     */
    async updateMatiere(id, data) {
        if (!data.matiere || !data.matiere.trim()) {
            alert('Veuillez saisir une matière');
            return;
        }

        try {
            const response = await this.api.updateMatiere(id, { matiere: data.matiere.trim() });
            if (response.success) {
                await this.loadMatieres();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateMatiere:', error);
        }
    }

    async deleteMatiere(id) {
        try {
            const response = await this.api.deleteMatiere(id);
            if (response.success) {
                await this.loadMatieres();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteMatiere:', error);
        }
    }
}

/**
 * Sous-contrôleur de gestion des classes.
 */
export default class ManagementClassesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge et affiche la liste des classes.
     * @returns {Promise<void>}
     */
    async loadClasses() {
        try {
            const response = await this.api.getAllClasses();
            const classes = response.success ? response.results : [];
            this.parent.view.setScheduleClasses(classes);
            this.parent.view.displayClasses(classes);
        } catch (error) {
            console.error('Erreur loadClasses:', error);
            this.parent.view.setScheduleClasses([]);
            this.parent.view.displayClasses([]);
        }
    }

    /**
     * Ajoute une classe après validation du nom.
     * @param {{classe: string}} data
     * @returns {Promise<void>}
     */
    async addClass(data) {
        if (!data.classe || !data.classe.trim()) {
            alert('Veuillez saisir une classe');
            return;
        }

        try {
            const response = await this.api.addClass({ classe: data.classe.trim() });
            if (response.success) {
                await this.loadClasses();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur addClass:', error);
        }
    }

    /**
     * Met à jour le nom d'une classe.
     * @param {number|string} id
     * @param {{classe: string}} data
     * @returns {Promise<void>}
     */
    async updateClass(id, data) {
        if (!data.classe || !data.classe.trim()) {
            alert('Veuillez saisir une classe');
            return;
        }

        try {
            const response = await this.api.updateClass(id, { classe: data.classe.trim() });
            if (response.success) {
                await this.loadClasses();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateClass:', error);
        }
    }

    /**
     * Supprime une classe par son ID.
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    async deleteClass(id) {
        try {
            const response = await this.api.deleteClass(id);
            if (response.success) {
                await this.loadClasses();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteClass:', error);
        }
    }
}

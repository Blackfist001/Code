/**
 * Sous-controleur de gestion des locaux.
 */
export default class ManagementClassroomController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge et affiche la liste des locaux.
     * @returns {Promise<void>}
     */
    async loadClassrooms() {
        try {
            const response = await this.api.getAllClassrooms();
            const classrooms = response.success ? response.results : [];
            this.parent.view.displayClassrooms(classrooms);
        } catch (error) {
            console.error('Erreur loadClassrooms:', error);
            this.parent.view.displayClassrooms([]);
        }
    }

    /**
     * Ajoute un local apres validation du nom.
     * @param {{local: string}} data
     * @returns {Promise<void>}
     */
    async addClassroom(data) {
        if (!data.local || !data.local.trim()) {
            alert('Veuillez saisir un local');
            return;
        }

        try {
            const response = await this.api.addClassroom({ local: data.local.trim() });
            if (response.success) {
                await this.loadClassrooms();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur addClassroom:', error);
        }
    }

    /**
     * Met a jour le nom d'un local.
     * @param {number|string} id
     * @param {{local: string}} data
     * @returns {Promise<void>}
     */
    async updateClassroom(id, data) {
        if (!data.local || !data.local.trim()) {
            alert('Veuillez saisir un local');
            return;
        }

        try {
            const response = await this.api.updateClassroom(id, { local: data.local.trim() });
            if (response.success) {
                await this.loadClassrooms();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateClassroom:', error);
        }
    }

    /**
     * Supprime un local par son ID.
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    async deleteClassroom(id) {
        try {
            const response = await this.api.deleteClassroom(id);
            if (response.success) {
                await this.loadClassrooms();
                await this.parent.refreshScheduleOptions();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteClassroom:', error);
        }
    }
}

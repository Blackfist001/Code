/**
 * Sous-contrôleur de gestion des horaires de cours.
 */
export default class ManagementSchedulesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge les listes de classes et de matières pour les menus déroulants du formulaire.
     * @returns {Promise<void>}
     */
    async loadScheduleOptions() {
        try {
            const [classesResponse, matieresResponse] = await Promise.all([
                this.api.getAllClasses(),
                this.api.getAllMatieres(),
            ]);

            this.parent.view.setScheduleClasses(classesResponse.success ? classesResponse.results : []);
            this.parent.view.setScheduleMatieres(matieresResponse.success ? matieresResponse.results : []);
        } catch (error) {
            console.error('Erreur loadScheduleOptions:', error);
            this.parent.view.setScheduleClasses([]);
            this.parent.view.setScheduleMatieres([]);
        }
    }

    /**
     * Recharge les options de classes et matières (après un ajout ou une suppression).
     * @returns {Promise<void>}
     */
    async refreshScheduleOptions() {
        await this.loadScheduleOptions();
    }

    /**
     * Charge les créneaux horaires disponibles et les transmet à la vue.
     * @returns {Promise<void>}
     */
    async loadScheduleSlots() {
        try {
            const response = await this.api.getScheduleSlots();
            this.parent.view.setScheduleSlots(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadScheduleSlots:', error);
            this.parent.view.setScheduleSlots([]);
        }
    }

    /**
     * Charge et affiche tous les horaires de cours.
     * @returns {Promise<void>}
     */
    async loadSchedules() {
        try {
            const response = await this.api.getAllSchedules();
            this.parent.view.displaySchedules(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadSchedules:', error);
            this.parent.view.displaySchedules([]);
        }
    }

    /**
     * Ajoute un horaire de cours.
     * @param {Object} data - Champs du formulaire
     * @returns {Promise<void>}
     */
    async addSchedule(data) {
        try {
            const response = await this.api.addSchedule(data);
            if (response.success) {
                await this.loadSchedules();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur addSchedule:', error);
        }
    }

    /**
     * Met à jour un horaire de cours.
     * @param {number|string} id
     * @param {Object} data - Champs à modifier
     * @returns {Promise<void>}
     */
    async updateSchedule(id, data) {
        try {
            const response = await this.api.updateSchedule(id, data);
            if (response.success) {
                await this.loadSchedules();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateSchedule:', error);
        }
    }

    /**
     * Supprime un horaire de cours.
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    async deleteSchedule(id) {
        try {
            const response = await this.api.deleteSchedule(id);
            if (response.success) {
                await this.loadSchedules();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteSchedule:', error);
        }
    }
}

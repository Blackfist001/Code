export default class ManagementSchedulesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

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

    async refreshScheduleOptions() {
        await this.loadScheduleOptions();
    }

    async loadScheduleSlots() {
        try {
            const response = await this.api.getScheduleSlots();
            this.parent.view.setScheduleSlots(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadScheduleSlots:', error);
            this.parent.view.setScheduleSlots([]);
        }
    }

    async loadSchedules() {
        try {
            const response = await this.api.getAllSchedules();
            this.parent.view.displaySchedules(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadSchedules:', error);
            this.parent.view.displaySchedules([]);
        }
    }

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

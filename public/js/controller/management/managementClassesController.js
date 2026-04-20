export default class ManagementClassesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

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

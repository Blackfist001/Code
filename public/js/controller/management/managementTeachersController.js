/**
 * Sous-contrôleur de la section professeurs.
 */
export default class ManagementTeachersController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge et affiche la liste des professeurs.
     * @returns {Promise<void>}
     */
    async loadTeachers() {
        try {
            const response = await this.api.getAllTeachers();
            const teachers = response.success ? response.results : [];
            this.parent.view.displayTeachers(teachers);
        } catch (error) {
            console.error('Erreur loadTeachers:', error);
            this.parent.view.displayTeachers([]);
        }
    }

    async addTeacher(data) {
        if (!data.nom || !data.prenom || !data.email || !data.username) {
            alert('Veuillez remplir tous les champs');
            return false;
        }

        try {
            const response = await this.api.addTeacher(data);
            if (response.success) {
                alert(response.message || 'Professeur ajouté');
                await this.loadTeachers();
                return true;
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
                return false;
            }
        } catch (error) {
            console.error('Erreur addTeacher:', error);
            return false;
        }
    }

    async updateTeacher(teacherId, data) {
        if (!data.nom || !data.prenom || !data.email || !data.username) {
            alert('Veuillez remplir tous les champs');
            return false;
        }

        try {
            const response = await this.api.updateTeacher(teacherId, data);
            if (response.success) {
                alert(response.message || 'Professeur mis à jour');
                await this.loadTeachers();
                return true;
            } else {
                alert(response.message || 'Erreur lors de la modification');
                return false;
            }
        } catch (error) {
            console.error('Erreur updateTeacher:', error);
            return false;
        }
    }

    async deleteTeacher(teacherId) {
        try {
            const response = await this.api.deleteTeacher(teacherId);
            if (response.success) {
                alert(response.message || 'Professeur supprimé');
                await this.loadTeachers();
                return true;
            } else {
                alert(response.message || 'Erreur lors de la suppression');
                return false;
            }
        } catch (error) {
            console.error('Erreur deleteTeacher:', error);
            return false;
        }
    }
}

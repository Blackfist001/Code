/**
 * Sous-contrôleur de gestion des étudiants.
 */
export default class ManagementStudentsController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge et affiche la liste des étudiants.
     * @returns {Promise<void>}
     */
    async loadStudents() {
        try {
            const response = await this.api.getAllStudents();
            this.parent.view.displayStudents(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadStudents:', error);
            this.parent.view.displayStudents([]);
        }
    }

    /**
     * Alimente la liste déroulante d'étudiants dans le formulaire d'ajout de passage.
     * @returns {Promise<void>}
     */
    async loadPassageFormStudents() {
        try {
            const response = await this.api.getAllStudents();
            this.parent.view.setPassageStudents(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadPassageFormStudents:', error);
            this.parent.view.setPassageStudents([]);
        }
    }

    /**
     * Ajoute un étudiant après validation des champs obligatoires (nom, prénom, classe).
     * @param {Object} data - Champs du formulaire
     * @returns {Promise<void>}
     */
    async addStudent(data) {
        if (!data.nom || !data.prenom || !data.classe) {
            alert('Nom, prénom et classe sont obligatoires.');
            return;
        }

        try {
            const response = await this.api.addStudent(data);
            if (response.success) {
                const nom = document.getElementById('student-nom');
                const prenom = document.getElementById('student-prenom');
                const naissance = document.getElementById('student-naissance');
                const classe = document.getElementById('student-classe');
                const midi = document.getElementById('student-midi');
                if (nom) nom.value = '';
                if (prenom) prenom.value = '';
                if (naissance) naissance.value = '';
                if (classe) classe.value = '';
                if (midi) midi.checked = false;

                await this.loadStudents();
                await this.loadPassageFormStudents();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur addStudent:', error);
        }
    }

    /**
     * Met à jour les données d'un étudiant.
     * @param {number|string} id
     * @param {Object} data - Champs à modifier
     * @returns {Promise<void>}
     */
    async updateStudent(id, data) {
        try {
            const response = await this.api.updateStudent(id, data);
            if (response.success) {
                await this.loadStudents();
                await this.loadPassageFormStudents();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateStudent:', error);
        }
    }

    /**
     * Supprime un étudiant par son ID.
     * @param {number|string} id
     * @returns {Promise<void>}
     */
    async deleteStudent(id) {
        try {
            const response = await this.api.deleteStudent(id);
            if (response.success) {
                await this.loadStudents();
                await this.loadPassageFormStudents();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteStudent:', error);
        }
    }
}

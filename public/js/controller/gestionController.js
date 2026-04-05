import GestionView from "../view/gestionView.js";
import api from "../api.js";

export default class GestionController {

    constructor() {
        this.view = new GestionView(this);
    }

    async loadGestion() {
        await this.view.render();
        // La section passages est active par défaut, chargée par _attachSidebarNav()
    }

    async deleteUser(userId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
            try {
                const response = await api.deleteUser(userId);

                if (response.success) {
                    alert(response.message);
                    this.loadUsers();
                } else {
                    alert(response.message || 'Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    }

    async addUser(userData) {
        // Valider les données
        if(!userData.username || !userData.password || !userData.role) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        try {
            const response = await api.addUser(userData);
            
            if (response.success) {
                alert(response.message);
                this.loadUsers();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async updateUser(userId, userData) {
        // Valider les données
        if(!userData.username || !userData.role) {
            alert('Le nom d\'utilisateur et le rôle sont obligatoires');
            return;
        }
        
        try {
            const updateData = {
                username: userData.username,
                role: userData.role
            };
            
            // Inclure le mot de passe seulement s'il est fourni
            if (userData.password && userData.password.trim() !== '') {
                updateData.password = userData.password;
            }
            
            const response = await api.updateUser(userId, updateData);
            
            if (response.success) {
                alert(response.message);
                this.loadUsers();
            } else {
                alert(response.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await api.getAllUsers();
            if (response.success) {
                this.view.displayUsers(response.results);
            } else {
                this.view.displayUsers([]);
                console.warn('Gestion-users: API réponse sans succès', response.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.view.displayUsers([]);
        }
    }

    // ─── Étudiants ──────────────────────────────────────────────────────────

    async loadStudents() {
        try {
            const response = await api.getAllStudents();
            this.view.displayStudents(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadStudents:', error);
            this.view.displayStudents([]);
        }
    }

    async deleteStudent(id) {
        try {
            const response = await api.deleteStudent(id);
            if (response.success) {
                this.loadStudents();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteStudent:', error);
        }
    }

    async updateStudent(id, data) {
        try {
            const response = await api.updateStudent(id, data);
            if (response.success) {
                this.loadStudents();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateStudent:', error);
        }
    }

    // ─── Passages ────────────────────────────────────────────────────────────

    async loadPassages() {
        try {
            const response = await api.searchMovementsByStudent({});
            this.view.displayPassages(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadPassages:', error);
            this.view.displayPassages([]);
        }
    }

    async loadPassagesByDate(date) {
        try {
            const response = await api.searchMovementsByStudent({ date });
            this.view.displayPassages(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadPassagesByDate:', error);
            this.view.displayPassages([]);
        }
    }

    async deletePassage(id) {
        try {
            const response = await api.deleteMovement(id);
            if (response.success) {
                this.loadPassages();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deletePassage:', error);
        }
    }

    async updatePassage(id, data) {
        try {
            const response = await api.updateMovement(id, data);
            if (response.success) {
                this.loadPassages();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updatePassage:', error);
        }
    }

    // ─── Horaires ────────────────────────────────────────────────────────────

    async loadSchedules() {
        try {
            const response = await api.getAllSchedules();
            this.view.displaySchedules(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadSchedules:', error);
            this.view.displaySchedules([]);
        }
    }

    async addSchedule(data) {
        try {
            const response = await api.addSchedule(data);
            if (response.success) {
                this.loadSchedules();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur addSchedule:', error);
        }
    }

    async updateSchedule(id, data) {
        try {
            const response = await api.updateSchedule(id, data);
            if (response.success) {
                this.loadSchedules();
            } else {
                alert(response.message || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Erreur updateSchedule:', error);
        }
    }

    async deleteSchedule(id) {
        try {
            const response = await api.deleteSchedule(id);
            if (response.success) {
                this.loadSchedules();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur deleteSchedule:', error);
        }
    }
}
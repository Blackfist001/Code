import GestionView from "../view/gestionView.js";
import api from "../api.js";

export default class GestionController {

    constructor() {
        this.view = new GestionView(this);
    }

    async loadGestion() {
        await this.view.render();
        this.loadUsers();
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
}
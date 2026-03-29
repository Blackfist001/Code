import GestionView from "../view/gestionView.js";
import UsersModel from "../model/usersModel.js";
import api from "../api.js";

export default class GestionController {

    constructor() {
        this.view = new GestionView(this);
        this.usersModel = new UsersModel();
    }

    loadGestion() {
        this.view.render();
        this.loadUsers();
    }

    async deleteUser(userId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
            try {
                const response = await api.request('deleteUser.php', {
                    method: 'POST',
                    body: JSON.stringify({ id: userId })
                });

                if (response.success) {
                    alert(response.message);
                    this.loadUsers();
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
            const response = await api.request('addUser.php', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                alert(response.message);
                this.loadUsers();
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
                id: userId,
                username: userData.username,
                role: userData.role
            };
            
            // Inclure le mot de passe seulement s'il est fourni
            if (userData.password && userData.password.trim() !== '') {
                updateData.password = userData.password;
            }
            
            const response = await api.request('updateUser.php', {
                method: 'POST',
                body: JSON.stringify(updateData)
            });
            
            if (response.success) {
                alert(response.message);
                this.loadUsers();
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

        async loadUsers() {
        try {
            const response = await api.request('getAllUsers.php');
            
            if (response.success) {
                this.view.displayUsers(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
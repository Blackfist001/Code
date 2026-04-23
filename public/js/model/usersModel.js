import api from "../api.js";

/**
 * Modèle des utilisateurs.
 * Encapsule les appels API CRUD sur les utilisateurs de l'application.
 */
export default class UsersModel {

    constructor() {
        this.users = [];
    }

    /**
     * Ajoute un utilisateur via l'API.
     * @param {{username: string, password: string, role: string}} userData
     * @returns {Promise<void>}
     */
    addUser(userData) {
        // Utiliser l'API centralisée
        return api.addUser(userData)
            .then(data => {
                if(data.success) {
                    alert(`Utilisateur ${userData.name} ajouté avec succès`);
                    console.log('User added:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de l\'ajout de l\'utilisateur');
                console.error('Error:', error);
            });
    }

    /**
     * Supprime un utilisateur par son ID.
     * @param {number|string} userId
     * @returns {Promise<void>}
     */
    removeUser(userId) {
        // Utiliser l'API centralisée
        return api.deleteUser(userId)
            .then(data => {
                if(data.success) {
                    alert('Utilisateur supprimé avec succès');
                    console.log('User removed:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de la suppression de l\'utilisateur');
                console.error('Error:', error);
            });
    }

    /**
     * Met à jour les données d'un utilisateur.
     * @param {number|string} userId
     * @param {{username?: string, role?: string, password?: string}} userData
     * @returns {Promise<void>}
     */
    updateUser(userId, userData) {
        // Utiliser l'API centralisée
        return api.updateUser(userId, userData)
            .then(data => {
                if(data.success) {
                    alert('Utilisateur mis à jour avec succès');
                    console.log('User updated:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de la mise à jour de l\'utilisateur');
                console.error('Error:', error);
            });
    }

    /**
     * Récupère la liste de tous les utilisateurs.
     * @returns {Promise<Array>}
     */
    async getUsers() {
        try {
            const response = await api.getAllUsers();
            if (response.success) {
                this.users = response.results;
                return this.users;
            }
            console.warn('usersModel.getUsers: non success response', response);
            return [];
        } catch (error) {
            console.error('Erreur getUsers:', error);
            return [];
        }
    }
}
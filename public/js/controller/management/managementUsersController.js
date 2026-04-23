/**
 * Sous-contrôleur de gestion des utilisateurs.
 */
export default class ManagementUsersController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge la liste des utilisateurs et l'affiche dans la vue.
     * @returns {Promise<void>}
     */
    async loadUsers() {
        try {
            const response = await this.api.getAllUsers();
            if (response.success) {
                this.parent.view.displayUsers(response.results);
            } else {
                this.parent.view.displayUsers([]);
                console.warn('Gestion-users: API réponse sans succès', response.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.parent.view.displayUsers([]);
        }
    }

    /**
     * Ajoute un utilisateur après validation des champs obligatoires.
     * @param {{username: string, password: string, role: string}} userData
     * @returns {Promise<void>}
     */
    async addUser(userData) {
        if (!userData.username || !userData.password || !userData.role) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        try {
            const response = await this.api.addUser(userData);
            if (response.success) {
                alert(response.message);
                await this.loadUsers();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    /**
     * Met à jour un utilisateur. Le mot de passe n'est modifié que s'il est fourni.
     * @param {number|string} userId
     * @param {{username: string, role: string, password?: string}} userData
     * @returns {Promise<void>}
     */
    async updateUser(userId, userData) {
        if (!userData.username || !userData.role) {
            alert('Le nom d\'utilisateur et le rôle sont obligatoires');
            return;
        }

        try {
            const updateData = {
                username: userData.username,
                role: userData.role,
            };

            if (userData.password && userData.password.trim() !== '') {
                updateData.password = userData.password;
            }

            const response = await this.api.updateUser(userId, updateData);
            if (response.success) {
                alert(response.message);
                await this.loadUsers();
            } else {
                alert(response.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    /**
     * Supprime un utilisateur par son ID.
     * @param {number|string} userId
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        try {
            const response = await this.api.deleteUser(userId);
            if (response.success) {
                alert(response.message);
                await this.loadUsers();
            } else {
                alert(response.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}

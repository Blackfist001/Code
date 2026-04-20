export default class ManagementUsersController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

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

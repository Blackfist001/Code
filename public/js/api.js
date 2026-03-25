/**
 * Couche API centralisée
 * Gère tous les appels au backend PHP
 */

class API {
    constructor(baseUrl = 'php/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Effectue une requête fetch avec gestion d'erreur
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const fetchOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, { ...fetchOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ==================== ÉTUDIANTS ====================
    
    /**
     * Recherche les étudiants
     */
    async searchStudents(query) {
        return this.request(`searchStudents.php?q=${encodeURIComponent(query)}`);
    }

    /**
     * Obtient tous les étudiants
     */
    async getAllStudents() {
        return this.request('getAllStudents.php');
    }

    /**
     * Récupère un étudiant par ID
     */
    async getStudentById(id) {
        return this.request(`getStudent.php?id=${id}`);
    }

    // ==================== PASSAGES (MOUVEMENTS) ====================
    
    /**
     * Ajoute un passage
     */
    async addMovement(movementData) {
        return this.request('addMovement.php', {
            method: 'POST',
            body: JSON.stringify(movementData)
        });
    }

    /**
     * Recherche les passages
     */
    async searchMovements(query) {
        return this.request(`searchMovements.php?q=${encodeURIComponent(query)}`);
    }

    /**
     * Obtient tous les passages
     */
    async getAllMovements() {
        return this.request('getAllMovements.php');
    }

    /**
     * Obtient les passages d'un étudiant
     */
    async getMovementsByStudentId(studentId) {
        return this.request(`getStudentMovements.php?id=${studentId}`);
    }

    /**
     * Met à jour un passage
     */
    async updateMovement(movementId, movementData) {
        return this.request('updateMovement.php', {
            method: 'POST',
            body: JSON.stringify({ id: movementId, ...movementData })
        });
    }

    // ==================== UTILISATEURS ====================
    
    /**
     * Ajoute un utilisateur
     */
    async addUser(userData) {
        return this.request('addUser.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Récupère tous les utilisateurs
     */
    async getAllUsers() {
        return this.request('getAllUsers.php');
    }

    /**
     * Met à jour un utilisateur
     */
    async updateUser(userId, userData) {
        return this.request('updateUser.php', {
            method: 'POST',
            body: JSON.stringify({ id: userId, ...userData })
        });
    }

    /**
     * Supprime un utilisateur
     */
    async deleteUser(userId) {
        return this.request('deleteUser.php', {
            method: 'POST',
            body: JSON.stringify({ id: userId })
        });
    }

    /**
     * Authentification
     */
    async login(username, password) {
        return this.request('login.php', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    /**
     * Déconnexion
     */
    async logout() {
        return this.request('logout.php', {
            method: 'POST'
        });
    }
}

// Exporter une instance singleton
export default new API();

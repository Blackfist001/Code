/**
 * Couche API centralisée
 * Gère tous les appels au backend PHP
 */

class API {
    constructor(baseUrl = '/api') {
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
            // Si c'est un export CSV, retourner le blob
            if (endpoint.startsWith('export/csv')) {
                return await response.blob();
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
        return this.request('students/search', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
    }

    /**
     * Obtient tous les étudiants
     */
    async getAllStudents() {
        return this.request('students');
    }

    /**
     * Récupère un étudiant par ID
     */
    async getStudentById(id) {
        return this.request(`students/${id}`);
    }

    // ==================== PASSAGES (MOUVEMENTS) ====================
    
    /**
     * Ajoute un passage
     */
    async addMovement(movementData) {
        return this.request('movements/add', {
            method: 'POST',
            body: JSON.stringify(movementData)
        });
    }

    /**
     * Recherche les passages
     */
    async searchMovements(query) {
        return this.request('movements/search', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
    }

    /**
     * Obtient tous les passages
     */
    async getAllMovements() {
        return this.request('movements');
    }

    /**
     * Obtient les passages d'un étudiant
     */
    async getMovementsByStudentId(studentId) {
        return this.request(`movements/student/${studentId}`);
    }

    /**
     * Met à jour un passage
     */
    async updateMovement(movementId, movementData) {
        return this.request('movements/update', {
            method: 'POST',
            body: JSON.stringify({ id: movementId, ...movementData })
        });
    }

    // ==================== UTILISATEURS ====================
    
    /**
     * Ajoute un utilisateur
     */
    async addUser(userData) {
        return this.request('users/add', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Récupère tous les utilisateurs
     */
    async getAllUsers() {
        return this.request('users');
    }

    /**
     * Met à jour un utilisateur
     */
    async updateUser(userId, userData) {
        return this.request('users/update', {
            method: 'POST',
            body: JSON.stringify({ id: userId, ...userData })
        });
    }

    /**
     * Supprime un utilisateur
     */
    async deleteUser(userId) {
        return this.request('users/delete', {
            method: 'POST',
            body: JSON.stringify({ id: userId })
        });
    }

    /**
     * Authentification
     */
    async login(username, password) {
        return this.request('login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    /**
     * Déconnexion
     */
    async logout() {
        return this.request('logout', {
            method: 'POST'
        });
    }

    /**
     * Récupère les statistiques
     */
    async getStats() {
        return this.request('stats');
    }

    /**
     * Récupère les statistiques par date
     */
    async getStatsByDate(dateFrom, dateTo) {
        return this.request(`stats/dates?date_from=${dateFrom}&date_to=${dateTo}`);
    }

    /**
     * Récupère les absents du jour
     */
    async getTodayAbsents() {
        return this.request('absents/today');
    }

    /**
     * Récupère les passages (avec filtrage)
     */
    async getPassages(dateFrom = null, dateTo = null) {
        let url = 'passages';
        if (dateFrom && dateTo) {
            url += `?date_from=${dateFrom}&date_to=${dateTo}`;
        }
        return this.request(url);
    }

    /**
     * Export CSV
     */
    async exportCSV(dateFrom, dateTo) {
        return this.request(`export/csv?date_from=${dateFrom}&date_to=${dateTo}`);
    }
}

// Exporter une instance singleton
export default new API();

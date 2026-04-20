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
     * Recherche les étudiants avec filtres avancés
     */
    async searchStudents(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.id) params.append('id', filters.id);
        if (filters.sourcedId) params.append('sourcedId', filters.sourcedId);
        if (filters.name) params.append('name', filters.name);
        if (filters.surname) params.append('surname', filters.surname);
        if (filters.classe) params.append('classe', filters.classe);
        if (filters.statut) params.append('statut', filters.statut);
        
        const queryString = params.toString();
        return this.request(`students/search${queryString ? '?' + queryString : ''}`);
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

    /**
     * Ajoute un étudiant
     */
    async addStudent(studentData) {
        return this.request('students/add', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    /**
     * Modifie un étudiant
     */
    async updateStudent(id, data) {
        return this.request('students/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    /**
     * Supprime un étudiant
     */
    async deleteStudent(id) {
        return this.request('students/delete', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
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
     * Recherche les passages filtrés par infos étudiant
     */
    async searchMovementsByStudent(filters = {}) {
        const params = new URLSearchParams();
        if (filters.nom)       params.append('nom',       filters.nom);
        if (filters.prenom)    params.append('prenom',    filters.prenom);
        if (filters.classe)    params.append('classe',    filters.classe);
        if (filters.statut)    params.append('statut',    filters.statut);
        if (filters.date)      params.append('date',      filters.date);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to)   params.append('date_to',   filters.date_to);
        const qs = params.toString();
        return this.request(`movements/search-by-student${qs ? '?' + qs : ''}`);
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
     * Obtient les passages d'une date donnée
     */
    async getMovementsByDate(date) {
        return this.request(`passages?date=${date}`);
    }

    /**
     * Supprime un passage
     */
    async deleteMovement(id) {
        return this.request('movements/delete', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
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

    async getAllClasses() {
        return this.request('classes');
    }

    async addClass(data) {
        return this.request('classes/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateClass(id, data) {
        return this.request('classes/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteClass(id) {
        return this.request('classes/delete', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
    }

    async getAllMatieres() {
        return this.request('matieres');
    }

    async addMatiere(data) {
        return this.request('matieres/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateMatiere(id, data) {
        return this.request('matieres/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteMatiere(id) {
        return this.request('matieres/delete', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
    }

    // ==================== HORAIRES ====================

    async getAllSchedules() {
        return this.request('schedules');
    }

    async getScheduleSlots() {
        return this.request('schedules/creneaux');
    }

    async addSchedule(data) {
        return this.request('schedules/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateSchedule(id, data) {
        return this.request('schedules/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteSchedule(id) {
        return this.request('schedules/delete', {
            method: 'POST',
            body: JSON.stringify({ id })
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
     * Récupère l'emploi du temps d'une classe pour un jour donné
     */
    async getScheduleByClass(classe, jour = null) {
        let endpoint = `schedules/${encodeURIComponent(classe)}`;
        if (jour) {
            endpoint += `?jour=${encodeURIComponent(jour)}`;
        }
        return this.request(endpoint);
    }

    /**
     * Récupère les absents du jour
     */
    async getTodayAbsents() {
        return this.request('absents/today');
    }

    /**
     * Marque un étudiant absent
     */
    async markAbsent(studentId, reason = null) {
        const payload = { id_etudiant: studentId };
        if (reason) {
            payload.reason = reason;
        }

        return this.request('absents/add', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * Marque un étudiant absent justifié
     */
    async markJustifiedAbsent(studentId, reason = null) {
        const payload = { id_etudiant: studentId };
        if (reason) {
            payload.reason = reason;
        }

        return this.request('absents/add-justified', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
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

    /**
    * Enregistre un scan : le backend détermine automatiquement le type de passage
    * (Entrée matin / Sortie midi / Rentrée midi) et le statut (Autorisé, Refusé, En retard)
     * en fonction de l'heure et des données de l'étudiant.
     */
    async scanStudent(sourcedId) {
        return this.request('scan', {
            method: 'POST',
            body: JSON.stringify({ sourcedId })
        });
    }
}

// Exporter une instance singleton
export default new API();

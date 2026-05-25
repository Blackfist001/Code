/**
 * Couche API centralisée
 * Gère tous les appels au backend PHP
 */

class API {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.csrfToken = null;
        this.csrfTokenPromise = null;
        this.localPassagesKey = 'client_passages_journal_v1';
        this.localSchedulesKey = 'client_schedules_cache_v1';
        this.localStudentsKey = 'client_students_cache_v1';
        this.localDailyAbsenceStateKey = 'client_daily_absence_state_v1';
        this.retryIntervalMs = 60000;
        this.retryTimer = null;
        this.dailyAbsenceTimer = null;

        this.startPendingPassagesSync();
        this.startDailyAbsenceLoop();
    }

    shouldAttachCsrf(endpoint, method) {
        const normalizedEndpoint = String(endpoint || '').split('?')[0].replace(/^\/+/, '');

        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return false;
        }

        // Endpoints publics exclus du contrôle CSRF côté backend.
        if (normalizedEndpoint === 'login' || normalizedEndpoint === 'csrf-token') {
            return false;
        }

        return true;
    }

    async ensureCsrfToken() {
        if (this.csrfToken) {
            return this.csrfToken;
        }

        if (this.csrfTokenPromise) {
            return this.csrfTokenPromise;
        }

        this.csrfTokenPromise = fetch(`${this.baseUrl}/csrf-token`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Impossible de récupérer le token CSRF (HTTP ${response.status})`);
                }
                const data = await response.json();
                if (!data?.success || !data?.csrf_token) {
                    throw new Error('Réponse CSRF invalide');
                }
                this.csrfToken = data.csrf_token;
                return this.csrfToken;
            })
            .finally(() => {
                this.csrfTokenPromise = null;
            });

        return this.csrfTokenPromise;
    }

    /**
     * Effectue une requête fetch avec gestion d'erreur
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const method = (options.method || 'GET').toUpperCase();
        let requestBody = options.body;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.shouldAttachCsrf(endpoint, method)) {
            const csrfToken = await this.ensureCsrfToken();
            headers['X-CSRF-Token'] = csrfToken;

            // Fallback IIS/FastCGI : envoyer aussi le token dans le body JSON.
            if (typeof requestBody === 'string' && requestBody.trim() !== '') {
                try {
                    const parsedBody = JSON.parse(requestBody);
                    if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
                        parsedBody.csrf_token = csrfToken;
                        requestBody = JSON.stringify(parsedBody);
                    }
                } catch (_) {
                    // Body non JSON: on conserve tel quel.
                }
            } else if (!requestBody) {
                requestBody = JSON.stringify({ csrf_token: csrfToken });
            }
        }

        const fetchOptions = {
            method,
            headers,
            credentials: 'same-origin',
            ...options,
            body: requestBody,
            headers
        };

        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                let backendMessage = '';
                try {
                    const errorData = await response.json();
                    backendMessage = errorData?.error || errorData?.message || '';
                } catch (_) {
                    backendMessage = '';
                }

                throw new Error(
                    backendMessage
                        ? `HTTP ${response.status}: ${backendMessage}`
                        : `HTTP error! status: ${response.status}`
                );
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

    _isBrowserStorageAvailable() {
        return typeof window !== 'undefined' && !!window.localStorage;
    }

    _readJsonStorage(key, fallback = null) {
        if (!this._isBrowserStorageAvailable()) return fallback;
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    _writeJsonStorage(key, value) {
        if (!this._isBrowserStorageAvailable()) return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Stockage local indisponible:', error);
        }
    }

    _getLocalPassagesJournal() {
        return this._readJsonStorage(this.localPassagesKey, []);
    }

    _saveLocalPassagesJournal(entries) {
        this._writeJsonStorage(this.localPassagesKey, entries);
    }

    _appendLocalPassage(entry) {
        const journal = this._getLocalPassagesJournal();
        journal.push(entry);
        this._saveLocalPassagesJournal(journal);
    }

    _updateLocalPassage(localId, patch = {}) {
        const journal = this._getLocalPassagesJournal();
        const idx = journal.findIndex((item) => item.local_id === localId);
        if (idx === -1) return;

        journal[idx] = { ...journal[idx], ...patch };
        this._saveLocalPassagesJournal(journal);
    }

    _isDuplicatePassageMessage(message = '') {
        const msg = String(message || '').toLowerCase();
        return msg.includes('déjà') || msg.includes('deja') || msg.includes('already');
    }

    _buildLocalPassageEntry(endpoint, payload) {
        const now = new Date().toISOString();
        return {
            local_id: `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
            endpoint,
            payload,
            status: 'pending',
            created_at: now,
            updated_at: now,
            saved_at: null,
            retry_count: 0,
            last_error: null
        };
    }

    async _sendPassageWithLocalTracking(endpoint, payload) {
        const entry = this._buildLocalPassageEntry(endpoint, payload);
        this._appendLocalPassage(entry);

        try {
            const response = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response?.success || this._isDuplicatePassageMessage(response?.message)) {
                this._updateLocalPassage(entry.local_id, {
                    status: 'saved',
                    updated_at: new Date().toISOString(),
                    saved_at: new Date().toISOString(),
                    last_error: null
                });
            } else {
                this._updateLocalPassage(entry.local_id, {
                    status: 'failed',
                    updated_at: new Date().toISOString(),
                    last_error: response?.message || 'Échec applicatif'
                });
            }

            return response;
        } catch (error) {
            this._updateLocalPassage(entry.local_id, {
                status: 'pending',
                updated_at: new Date().toISOString(),
                retry_count: 1,
                last_error: error?.message || 'Erreur réseau'
            });

            return {
                success: false,
                queued: true,
                message: 'Réseau instable: passage stocké localement et re-tenté automatiquement.'
            };
        }
    }

    startPendingPassagesSync() {
        if (typeof window === 'undefined') return;
        if (this.retryTimer) return;

        this.retryTimer = window.setInterval(() => {
            this.flushPendingPassages();
        }, this.retryIntervalMs);

        window.addEventListener('online', () => {
            this.flushPendingPassages();
        });
    }

    async flushPendingPassages() {
        const journal = this._getLocalPassagesJournal();
        const pendings = journal.filter((item) => item.status === 'pending');

        for (const item of pendings) {
            try {
                const response = await this.request(item.endpoint, {
                    method: 'POST',
                    body: JSON.stringify(item.payload)
                });

                if (response?.success || this._isDuplicatePassageMessage(response?.message)) {
                    this._updateLocalPassage(item.local_id, {
                        status: 'saved',
                        updated_at: new Date().toISOString(),
                        saved_at: new Date().toISOString(),
                        last_error: null
                    });
                } else {
                    this._updateLocalPassage(item.local_id, {
                        status: 'failed',
                        updated_at: new Date().toISOString(),
                        last_error: response?.message || 'Échec applicatif'
                    });
                }
            } catch (error) {
                this._updateLocalPassage(item.local_id, {
                    status: 'pending',
                    updated_at: new Date().toISOString(),
                    retry_count: Number(item.retry_count || 0) + 1,
                    last_error: error?.message || 'Erreur réseau'
                });
            }
        }
    }

    _readScheduleCache() {
        return this._readJsonStorage(this.localSchedulesKey, {});
    }

    _writeScheduleCache(cache) {
        this._writeJsonStorage(this.localSchedulesKey, cache || {});
    }

    _saveScheduleCacheEntry(key, data) {
        const cache = this._readScheduleCache();
        cache[key] = {
            data,
            saved_at: new Date().toISOString()
        };
        this._writeScheduleCache(cache);
    }

    _getScheduleCacheEntry(key) {
        const cache = this._readScheduleCache();
        return cache[key] || null;
    }

    _getTodayDateString() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    _getDayNameFr(date = new Date()) {
        const day = String(date.toLocaleDateString('fr-FR', { weekday: 'long' }) || '').toLowerCase();
        const map = {
            'lundi': 'lundi',
            'mardi': 'mardi',
            'mercredi': 'mercredi',
            'jeudi': 'jeudi',
            'vendredi': 'vendredi',
            'samedi': 'samedi',
            'dimanche': 'dimanche'
        };
        return map[day] || day;
    }

    _getStudentsCache() {
        const cached = this._readJsonStorage(this.localStudentsKey, null);
        if (!cached || !Array.isArray(cached.results)) return null;
        return cached;
    }

    _saveStudentsCache(results = []) {
        this._writeJsonStorage(this.localStudentsKey, {
            saved_at: new Date().toISOString(),
            results: Array.isArray(results) ? results : []
        });
    }

    _getDailyAbsenceState() {
        return this._readJsonStorage(this.localDailyAbsenceStateKey, null);
    }

    _saveDailyAbsenceState(state) {
        this._writeJsonStorage(this.localDailyAbsenceStateKey, state);
    }

    _buildEmptyDailyAbsenceState(dateStr) {
        return {
            date: dateStr,
            school_open: false,
            opened_at: null,
            students: {},
            persisted_by_class: {}
        };
    }

    _ensureDailyAbsenceState(dateStr = this._getTodayDateString()) {
        const current = this._getDailyAbsenceState();
        if (!current || current.date !== dateStr) {
            const empty = this._buildEmptyDailyAbsenceState(dateStr);
            this._saveDailyAbsenceState(empty);
            return empty;
        }
        return current;
    }

    _normalizePresenceStatus(statut = '') {
        const s = String(statut || '').trim();
        if (s === 'En retard') return 'late';
        if (s === 'Présent') return 'present';
        return null;
    }

    async resolveStudentBySourcedId(sourcedId) {
        if (!sourcedId) return null;

        const cached = this._getStudentsCache();
        const fromCache = cached?.results?.find((s) => String(s?.sourcedId || '') === String(sourcedId));
        if (fromCache) return fromCache;

        try {
            const fresh = await this.getAllStudents();
            const list = Array.isArray(fresh?.results) ? fresh.results : [];
            return list.find((s) => String(s?.sourcedId || '') === String(sourcedId)) || null;
        } catch (_) {
            return null;
        }
    }

    async registerDailyPresence({ studentId, classe = '', nom = '', prenom = '', statut = 'Présent', typePassage = '' } = {}) {
        if (!studentId) return;

        const today = this._getTodayDateString();
        let state = this._ensureDailyAbsenceState(today);

        if (!state.school_open) {
            let students = [];
            try {
                const studentsResponse = await this.getAllStudents();
                students = Array.isArray(studentsResponse?.results) ? studentsResponse.results : [];
            } catch (_) {
                const cache = this._getStudentsCache();
                students = Array.isArray(cache?.results) ? cache.results : [];
            }

            const map = {};
            students.forEach((s) => {
                const id = Number(s?.id_etudiant || 0);
                if (!id) return;
                map[id] = {
                    id_etudiant: id,
                    nom: s?.nom || '',
                    prenom: s?.prenom || '',
                    classe: s?.classe || '',
                    state: 'absent',
                    last_type: null,
                    last_statut: null,
                    updated_at: null,
                    absent_persisted: false
                };
            });

            state = {
                date: today,
                school_open: true,
                opened_at: new Date().toISOString(),
                students: map,
                persisted_by_class: {}
            };
        }

        const id = Number(studentId);
        if (!state.students[id]) {
            state.students[id] = {
                id_etudiant: id,
                nom: nom || '',
                prenom: prenom || '',
                classe: classe || '',
                state: 'absent',
                last_type: null,
                last_statut: null,
                updated_at: null,
                absent_persisted: false
            };
        }

        if (nom) state.students[id].nom = nom;
        if (prenom) state.students[id].prenom = prenom;
        if (classe) state.students[id].classe = classe;

        const localPresence = this._normalizePresenceStatus(statut);
        if (localPresence) {
            state.students[id].state = localPresence;
        }
        state.students[id].last_statut = statut || state.students[id].last_statut;
        state.students[id].last_type = typePassage || state.students[id].last_type;
        state.students[id].updated_at = new Date().toISOString();

        this._saveDailyAbsenceState(state);
        await this.evaluateDailyAbsencePersistence();
    }

    _parseDateAndTime(dateStr, timeStr) {
        const [y, m, d] = String(dateStr).split('-').map(Number);
        const parts = String(timeStr || '00:00:00').split(':').map(Number);
        const hh = Number(parts[0] || 0);
        const mm = Number(parts[1] || 0);
        const ss = Number(parts[2] || 0);
        return new Date(y, (m || 1) - 1, d || 1, hh, mm, ss, 0);
    }

    async _computeClassThresholds(dateStr) {
        try {
            const schedules = await this.getAllSchedules();
            const rows = Array.isArray(schedules?.results) ? schedules.results : [];
            const todayFr = this._getDayNameFr(this._parseDateAndTime(dateStr, '00:00:00'));

            const firstSlotByClass = {};
            rows.forEach((row) => {
                const day = String(row?.jour_semaine || '').toLowerCase().trim();
                if (day !== todayFr) return;

                const classe = String(row?.classe || '').trim();
                const heureDebut = String(row?.heure_debut || '').slice(0, 8);
                if (!classe || !heureDebut) return;

                if (!firstSlotByClass[classe] || heureDebut < firstSlotByClass[classe]) {
                    firstSlotByClass[classe] = heureDebut;
                }
            });

            const thresholds = {};
            Object.entries(firstSlotByClass).forEach(([classe, startTime]) => {
                const threshold = this._parseDateAndTime(dateStr, startTime);
                threshold.setMinutes(threshold.getMinutes() + 20);
                thresholds[classe] = threshold.toISOString();
            });

            return thresholds;
        } catch (_) {
            return {};
        }
    }

    startDailyAbsenceLoop() {
        if (typeof window === 'undefined') return;
        if (this.dailyAbsenceTimer) return;

        this.dailyAbsenceTimer = window.setInterval(() => {
            this.evaluateDailyAbsencePersistence();
        }, this.retryIntervalMs);

        window.addEventListener('online', () => {
            this.evaluateDailyAbsencePersistence();
        });
    }

    async persistAbsenceBatch(payload) {
        return this.request('absents/persist-batch', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async evaluateDailyAbsencePersistence() {
        const today = this._getTodayDateString();
        const state = this._ensureDailyAbsenceState(today);
        if (!state.school_open) return;

        const thresholds = await this._computeClassThresholds(today);
        if (!thresholds || Object.keys(thresholds).length === 0) return;

        const now = new Date();
        const students = state.students || {};
        const persistedByClass = state.persisted_by_class || {};

        const absentByClass = {};
        Object.values(students).forEach((s) => {
            if (!s || s.state !== 'absent' || s.absent_persisted) return;
            const classe = String(s.classe || '').trim();
            if (!classe) return;
            if (!absentByClass[classe]) absentByClass[classe] = [];
            absentByClass[classe].push(Number(s.id_etudiant));
        });

        for (const [classe, thresholdIso] of Object.entries(thresholds)) {
            if (persistedByClass[classe]) continue;
            const threshold = new Date(thresholdIso);
            if (Number.isNaN(threshold.getTime()) || now < threshold) continue;

            const absentIds = absentByClass[classe] || [];
            if (absentIds.length === 0) {
                persistedByClass[classe] = {
                    persisted_at: new Date().toISOString(),
                    inserted: 0,
                    skipped: 0
                };
                continue;
            }

            try {
                const response = await this.persistAbsenceBatch({
                    date_passage: today,
                    classe,
                    student_ids: absentIds
                });

                if (response?.success) {
                    absentIds.forEach((id) => {
                        if (students[id]) {
                            students[id].absent_persisted = true;
                            students[id].updated_at = new Date().toISOString();
                        }
                    });

                    persistedByClass[classe] = {
                        persisted_at: new Date().toISOString(),
                        inserted: Number(response.inserted || 0),
                        skipped: Math.max(absentIds.length - Number(response.inserted || 0), 0)
                    };
                }
            } catch (_) {
                // Réessaiera automatiquement au tick suivant.
            }
        }

        state.students = students;
        state.persisted_by_class = persistedByClass;
        this._saveDailyAbsenceState(state);
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
        try {
            const response = await this.request('students');
            if (response?.success && Array.isArray(response.results)) {
                this._saveStudentsCache(response.results);
            }
            return response;
        } catch (error) {
            const cached = this._getStudentsCache();
            if (cached?.results) {
                return {
                    success: true,
                    count: cached.results.length,
                    results: cached.results,
                    from_cache: true,
                    message: 'Étudiants chargés depuis le cache local.'
                };
            }
            throw error;
        }
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
        return this._sendPassageWithLocalTracking('movements/add', movementData);
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
     * Obtient les raisons autorisées (ENUM passages.raison)
     */
    async getMovementReasonOptions() {
        return this.request('movements/reasons');
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

    async getPassageMetadata(kind) {
        return this.request(`passage-metadata/${encodeURIComponent(kind)}`);
    }

    async createPassageMetadata(kind, data) {
        return this.request(`passage-metadata/${encodeURIComponent(kind)}/create`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePassageMetadata(kind, id, data) {
        return this.request(`passage-metadata/${encodeURIComponent(kind)}/update`, {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deletePassageMetadata(kind, id) {
        return this.request(`passage-metadata/${encodeURIComponent(kind)}/delete`, {
            method: 'POST',
            body: JSON.stringify({ id })
        });
    }

    async getSettings() {
        return this.request('settings');
    }

    async getSettingsBackups() {
        return this.request('settings/backups');
    }

    async updateSettings(settingsData) {
        return this.request('settings/update', {
            method: 'POST',
            body: JSON.stringify(settingsData)
        });
    }

    async getAuditLogins() {
        return this.request('audits/logins');
    }

    async getAuditDbChanges() {
        return this.request('audits/db-changes');
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

    async getAllClassrooms() {
        return this.request('classroom');
    }

    async getAllTeachers() {
        return this.request('teachers');
    }

    async addTeacher(data) {
        return this.request('teachers/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTeacher(id, data) {
        return this.request('teachers/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteTeacher(id) {
        return this.request('teachers/delete', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
    }

    async addClassroom(data) {
        return this.request('classroom/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateClassroom(id, data) {
        return this.request('classroom/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteClassroom(id) {
        return this.request('classroom/delete', {
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
        const cacheKey = 'all';
        try {
            const response = await this.request('schedules');
            if (response?.success) {
                this._saveScheduleCacheEntry(cacheKey, response);
            }
            return response;
        } catch (error) {
            const cached = this._getScheduleCacheEntry(cacheKey);
            if (cached?.data) {
                return {
                    ...cached.data,
                    from_cache: true,
                    message: 'Horaires chargés depuis le cache local.'
                };
            }
            throw error;
        }
    }

    async getScheduleSlots() {
        const cacheKey = 'slots';
        try {
            const response = await this.request('schedules/creneaux');
            if (response?.success) {
                this._saveScheduleCacheEntry(cacheKey, response);
            }
            return response;
        } catch (error) {
            const cached = this._getScheduleCacheEntry(cacheKey);
            if (cached?.data) {
                return {
                    ...cached.data,
                    from_cache: true,
                    message: 'Créneaux chargés depuis le cache local.'
                };
            }
            throw error;
        }
    }

    async addScheduleSlot(data) {
        return this.request('schedules/slots/add', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateScheduleSlot(id, data) {
        return this.request('schedules/slots/update', {
            method: 'POST',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteScheduleSlot(id, type) {
        return this.request('schedules/slots/delete', {
            method: 'POST',
            body: JSON.stringify({ id, type })
        });
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

    async saveClassScheduleGrid(data) {
        return this.request('schedules/save-class-grid', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Authentification
     */
    async login(username, password) {
        const response = await this.request('login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        // Le backend effectue une rotation du token CSRF après login.
        // Invalider le cache local force un refresh du token pour les prochains POST.
        if (response?.success) {
            this.csrfToken = null;
            this.csrfTokenPromise = null;
        }

        return response;
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
        const cacheKey = `class:${String(classe || '').toLowerCase()}|jour:${String(jour || '').toLowerCase()}`;
        let endpoint = `schedules/${encodeURIComponent(classe)}`;
        if (jour) {
            endpoint += `?jour=${encodeURIComponent(jour)}`;
        }
        try {
            const response = await this.request(endpoint);
            if (response?.success) {
                this._saveScheduleCacheEntry(cacheKey, response);
            }
            return response;
        } catch (error) {
            const cached = this._getScheduleCacheEntry(cacheKey);
            if (cached?.data) {
                return {
                    ...cached.data,
                    from_cache: true,
                    message: 'Emploi du temps chargé depuis le cache local.'
                };
            }
            throw error;
        }
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
        return this._sendPassageWithLocalTracking('scan', { sourcedId });
    }
}

// Exporter une instance singleton
export default new API();

import api from '../api.js';

/**
 * Vue de la page des absences.
 * Affiche les absents du jour avec pagination et gestion du marquage d'absence.
 */
export default class AbsenceView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
        this.pageSize = 20;
        this.currentPage = 1;
        this.absents = [];
    }

    /**
     * Définit le contrôleur associé à cette vue.
     * @param {AbsenceController} controller
     */
    setController(controller) {
        this.controller = controller;
    }

    /**
     * Charge le HTML de la page absences et initialise les écouteurs.
     * @returns {Promise<void>}
     */
    async render() {
        try {
            const response = await fetch('html/absence.html');
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const data = await response.text();
            this.container.innerHTML = data;
            this._loadStudents();
            this.attachEventListeners();
        } catch (error) {
            console.error('Erreur rendu page absents:', error);
            this.container.innerHTML = '<div class="card"><p>Impossible de charger la page des absents.</p></div>';
        }
    }

    /**
     * Charge tous les étudiants et alimente le filtre de classe.
     * @returns {Promise<void>}
     */
    async _loadStudents() {
        try {
            const response = await api.getAllStudents();
            this._students = response.success ? (response.results ?? []) : [];

            const classes = [...new Set(this._students.map(s => s.classe).filter(Boolean))].sort();
            const classeSelect = document.getElementById('absent-classe');
            if (!classeSelect) return;

            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                classeSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Erreur chargement étudiants:', e);
        }
    }

    /**
     * Met à jour la liste des absents et réinitialise la pagination à la page 1.
     * @param {Array} [absents=[]] - Tableau des absents retourné par l'API
     */
    displayAbsents(absents = []) {
        this.absents = Array.isArray(absents) ? absents : [];
        this.currentPage = 1;
        this._renderAbsentsPage();
    }

    /**
     * Affiche la page courante d'absents dans le tableau.
     */
    _renderAbsentsPage() {
        const tbody = document.getElementById('absents-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const paginationContainer = this._getOrCreatePaginationContainer();
        
        if (!this.absents || this.absents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Aucun absent enregistré</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageItems = this.absents.slice(startIndex, endIndex);
        
        pageItems.forEach(absent => {
            const statusLabel = absent.statut || 'Absent';
            const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
            const STATUT_VERT = ['Présent', 'Autorisé'];
            const badgeClass = STATUT_ROUGE.includes(statusLabel)
                ? 'status-refuse'
                : (STATUT_VERT.includes(statusLabel) ? 'status-present' : 'status-info');
            const totalDemiJournees = Number(absent.demi_journee_absence) || 0;
            const demiJourneeClass = totalDemiJournees >= 9 ? 'demi-journee-critical' : '';
            const typeLabel = absent.type_passage || '---';
            const typeClass = 'status-info';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${absent.date_passage || '---'}</td>
                <td>${absent.nom || '---'}</td>
                <td>${absent.prenom || '---'}</td>
                <td>${absent.classe || '---'}</td>
                <td><span class="${demiJourneeClass}">${totalDemiJournees}</span></td>
                <td><span class="status-badge ${typeClass}">${typeLabel}</span></td>
                <td><span class="status-badge ${badgeClass}">${statusLabel}</span></td>
                <td>${absent.raison || absent.reason || '---'}</td>
            `;
            tbody.appendChild(row);
        });

        this._renderPagination(paginationContainer, this.absents.length);
    }

    /**
     * Retourne (ou crée) le conteneur de pagination sous le tableau.
     * @returns {HTMLElement|null}
     */
    _getOrCreatePaginationContainer() {
        let container = document.getElementById('absents-pagination');
        if (container) return container;

        const tbody = document.getElementById('absents-table-body');
        const table = tbody ? tbody.closest('table') : null;
        if (!table || !table.parentNode) return null;

        container = document.createElement('div');
        container.id = 'absents-pagination';
        container.className = 'list-pagination';
        table.parentNode.appendChild(container);
        return container;
    }

    /**
     * Rend les boutons de pagination dans le conteneur spécifié.
     * @param {HTMLElement} container - Conteneur cible
     * @param {number} totalItems     - Nombre total d'éléments
     */
    _renderPagination(container, totalItems) {
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.pageSize);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const prevDisabled = this.currentPage <= 1 ? 'disabled' : '';
        const nextDisabled = this.currentPage >= totalPages ? 'disabled' : '';
        container.innerHTML = `
            <button type="button" id="absents-page-prev" ${prevDisabled}>Precedent</button>
            <span>Page ${this.currentPage} / ${totalPages}</span>
            <button type="button" id="absents-page-next" ${nextDisabled}>Suivant</button>
        `;

        const prevBtn = document.getElementById('absents-page-prev');
        const nextBtn = document.getElementById('absents-page-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage -= 1;
                    this._renderAbsentsPage();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage += 1;
                    this._renderAbsentsPage();
                }
            });
        }
    }

    /**
     * Branche les écouteurs sur les filtres de classe et le bouton de marquage d'absence.
     */
    attachEventListeners() {
        const classeSelect  = document.getElementById('absent-classe');
        const nomSelect     = document.getElementById('absent-name');
        const prenomSelect  = document.getElementById('absent-surname');
        const addAbsentBtn  = document.getElementById('btn-add-absent');

        // --- Cascade classe → nom ---
        if (classeSelect) {
            classeSelect.addEventListener('change', () => {
                const classe = classeSelect.value;
                this._clearStudentSelection();
                nomSelect.innerHTML = '<option value="">-- Nom --</option>';
                prenomSelect.innerHTML = '<option value="">-- Prénom --</option>';
                nomSelect.disabled = true;
                prenomSelect.disabled = true;
                if (!classe) return;

                const noms = [...new Set(
                    (this._students || []).filter(s => s.classe === classe).map(s => s.nom)
                )].sort();
                noms.forEach(nom => {
                    const opt = document.createElement('option');
                    opt.value = nom;
                    opt.textContent = nom;
                    nomSelect.appendChild(opt);
                });
                nomSelect.disabled = false;
            });
        }

        // --- Cascade nom → prénom ---
        if (nomSelect) {
            nomSelect.addEventListener('change', () => {
                const classe = classeSelect.value;
                const nom    = nomSelect.value;
                this._clearStudentSelection();
                prenomSelect.innerHTML = '<option value="">-- Prénom --</option>';
                prenomSelect.disabled = true;
                if (!nom) return;

                const etudiants = (this._students || []).filter(s => s.classe === classe && s.nom === nom);
                etudiants.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id_etudiant;
                    opt.textContent = s.prenom;
                    prenomSelect.appendChild(opt);
                });
                prenomSelect.disabled = false;

                if (etudiants.length === 1) {
                    prenomSelect.value = etudiants[0].id_etudiant;
                    prenomSelect.dispatchEvent(new Event('change'));
                }
            });
        }

        // --- Prénom → sélectionne étudiant ---
        if (prenomSelect) {
            prenomSelect.addEventListener('change', () => {
                const studentId = prenomSelect.value;
                if (!studentId) { this._clearStudentSelection(); return; }
                document.getElementById('absent-student-id').value = studentId;
                if (addAbsentBtn) addAbsentBtn.disabled = false;
            });
        }

        // --- Bouton Ajouter ---
        if (addAbsentBtn && this.controller) {
            addAbsentBtn.addEventListener('click', () => {
                const studentId = document.getElementById('absent-student-id').value;
                const reason    = document.getElementById('absent-reason').value;
                if (studentId) {
                    this.controller.markAbsent(studentId, reason);
                }
            });
        }
    }

    /**
     * Réinitialise la sélection d'étudiant dans le formulaire de marquage.
     */
    _clearStudentSelection() {
        document.getElementById('absent-student-id').value = '';
        const btn = document.getElementById('btn-add-absent');
        if (btn) btn.disabled = true;
    }
}
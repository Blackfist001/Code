import api from '../api.js';

/**
 * Vue de la page de recherche.
 * Affiche les résultats de recherche de passages avec pagination et filtres cascadés.
 */
export default class SearchView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
        this.pageSize = 20;
        this.currentPage = 1;
        this.results = [];
    }

    /**
     * Charge le HTML de la page recherche et initialise les écouteurs et les listes.
     */
    render() {
        fetch('html/search.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this._loadStudents();
                this.attachSearchHandler();
            })
            .catch(error => console.error('Error loading search:', error));
    }

    /**
     * Charge tous les étudiants pour alimenter les filtres cascadés (classe → nom → prénom).
     * @returns {Promise<void>}
     */
    async _loadStudents() {
        try {
            const response = await api.getAllStudents();
            this._students = response.success ? (response.results ?? []) : [];

            const classes = [...new Set(this._students.map(s => s.classe).filter(Boolean))].sort();
            const classeSelect = document.getElementById('search-classe');
            if (!classeSelect) return;

            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                classeSelect.appendChild(opt);
            });

            // Populate nom with all students initially
            this._populateNomSelect(this._students);

            // Cascade: classe → nom → prénom
            classeSelect.addEventListener('change', () => {
                const classe = classeSelect.value;
                const filtered = classe
                    ? this._students.filter(s => s.classe === classe)
                    : this._students;
                this._populateNomSelect(filtered);
                this._populatePrenomSelect([]);
            });

            const nomSelect = document.getElementById('search-name');
            if (nomSelect) {
                nomSelect.addEventListener('change', () => {
                    const classe = classeSelect.value;
                    const nom    = nomSelect.value;
                    const filtered = this._students.filter(s =>
                        (!classe || s.classe === classe) && (!nom || s.nom === nom)
                    );
                    this._populatePrenomSelect(filtered);
                });
            }
        } catch (e) {
            console.error('Erreur chargement étudiants:', e);
        }
    }

    /**
     * Peuple le menu déroulant des noms avec les étudiants passés en paramètre.
     * Réinitialise également le menu des prénoms.
     * @param {Array} students - Tableau d'étudiants à afficher
     */
    _populateNomSelect(students) {
        const nomSelect = document.getElementById('search-name');
        if (!nomSelect) return;
        const noms = [...new Set(students.map(s => s.nom).filter(Boolean))].sort();
        nomSelect.innerHTML = '<option value="">Tous les noms</option>';
        noms.forEach(nom => {
            const opt = document.createElement('option');
            opt.value = nom;
            opt.textContent = nom;
            nomSelect.appendChild(opt);
        });
        // Reset prénom when nom list changes
        this._populatePrenomSelect([]);
    }

    /**
     * Peuple le menu déroulant des prénoms avec les étudiants passés en paramètre.
     * @param {Array} students - Tableau d'étudiants filtrés
     */
    _populatePrenomSelect(students) {
        const prenomSelect = document.getElementById('search-surname');
        if (!prenomSelect) return;
        const prenoms = [...new Set(students.map(s => s.prenom).filter(Boolean))].sort();
        prenomSelect.innerHTML = '<option value="">Tous les prénoms</option>';
        prenoms.forEach(prenom => {
            const opt = document.createElement('option');
            opt.value = prenom;
            opt.textContent = prenom;
            prenomSelect.appendChild(opt);
        });
    }

    /**
     * Branche les écouteurs `change` sur les filtres (classe, nom, prénom, statut)
     * et délègue au contrôleur à chaque modification.
     */
    attachSearchHandler() {
        const classeSelect = document.getElementById('search-classe');
        const nomSelect = document.getElementById('search-name');
        const prenomSelect = document.getElementById('search-surname');
        const statutSelect = document.getElementById('search-statut');

        // Ajouter écouteurs de changement pour chaque select
        if (classeSelect) {
            classeSelect.addEventListener('change', () => this._performSearch());
        }
        if (nomSelect) {
            nomSelect.addEventListener('change', () => this._performSearch());
        }
        if (prenomSelect) {
            prenomSelect.addEventListener('change', () => this._performSearch());
        }
        if (statutSelect) {
            statutSelect.addEventListener('change', () => this._performSearch());
        }
    }

    /**
     * Déclenche une recherche via le contrôleur.
     */
    _performSearch() {
        this.controller.searchStudent();
    }

    /**
     * Réinitialise les filtres classe, nom et prénom à leur état initial.
     */
    resetSelects() {
        const classeSelect  = document.getElementById('search-classe');
        const nomSelect     = document.getElementById('search-name');
        const prenomSelect  = document.getElementById('search-surname');
        if (classeSelect)  classeSelect.value = '';
        if (nomSelect)     { this._populateNomSelect(this._students || []); }
        if (prenomSelect)  { this._populatePrenomSelect([]); }
    }

    /**
     * Met à jour la liste des résultats et réinitialise la pagination à la page 1.
     * @param {Array} results - Tableau des passages retourné par le contrôleur
     */
    displayResults(results) {
        this.results = Array.isArray(results) ? results : [];
        this.currentPage = 1;
        this._renderResultsPage();
    }

    /**
     * Affiche la page courante de résultats dans le tableau avec les badges de statut.
     */
    _renderResultsPage() {
        const tbody = document.getElementById('search-results-body');
        const messageDiv = document.getElementById('search-message');
        const paginationContainer = this._getOrCreatePaginationContainer();

        if (!tbody) return;

        tbody.innerHTML = '';

        if (!this.results || this.results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">Aucun résultat trouvé</td></tr>';
            if (messageDiv) messageDiv.textContent = 'Aucun passage trouvé';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageItems = this.results.slice(startIndex, endIndex);

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];
        const STATUT_BLEU  = ['Absence justifiée', 'Sortie justifiée', "Aucun passage aujourd'hui"];

        pageItems.forEach(passage => {
            const statut = passage.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : (STATUT_BLEU.includes(statut) ? 'status-info' : 'status-info');
            const typePassage = passage.type_passage || '---';
            const typeClass = 'status-info';
            const reasonLabel = passage.raison || passage.reason || '---';
            const reasonClass = 'status-info';
            const totalDemiJournees = Number(passage.total_demi_journees) || 0;
            const demiJourneeClass = totalDemiJournees >= 9 ? 'demi-journee-critical' : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${passage.date_passage || '---'}</td>
                <td>${passage.heure_passage || '---'}</td>
                <td>${passage.nom || '---'}</td>
                <td>${passage.prenom || '---'}</td>
                <td>${passage.classe || '---'}</td>
                <td><span class="${demiJourneeClass}">${totalDemiJournees}</span></td>
                <td><span class="status-badge ${typeClass}">${typePassage}</span></td>
                <td><span class="status-badge ${statutClass}">${statut}</span></td>
                <td><span class="status-badge ${reasonClass}">${reasonLabel}</span></td>
            `;
            tbody.appendChild(row);
        });

        if (messageDiv) messageDiv.textContent = `${this.results.length} passage(s) trouvé(s)`;
        this._renderPagination(paginationContainer, this.results.length);
    }

    _getOrCreatePaginationContainer() {
        let container = document.getElementById('search-results-pagination');
        if (container) return container;

        const tbody = document.getElementById('search-results-body');
        const table = tbody ? tbody.closest('table') : null;
        if (!table || !table.parentNode) return null;

        container = document.createElement('div');
        container.id = 'search-results-pagination';
        container.className = 'list-pagination';
        table.parentNode.appendChild(container);
        return container;
    }

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
            <button type="button" id="search-page-prev" ${prevDisabled}>Precedent</button>
            <span>Page ${this.currentPage} / ${totalPages}</span>
            <button type="button" id="search-page-next" ${nextDisabled}>Suivant</button>
        `;

        const prevBtn = document.getElementById('search-page-prev');
        const nextBtn = document.getElementById('search-page-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage -= 1;
                    this._renderResultsPage();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage += 1;
                    this._renderResultsPage();
                }
            });
        }
    }

    clearMessage() {
        const messageDiv = document.getElementById('search-message');
        if (messageDiv) {
            messageDiv.textContent = '';
        }
    }
}
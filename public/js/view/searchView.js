import api from '../api.js';
import '../vendor/jspdf.umd.min.js';

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

        const exportPdfBtn = document.getElementById('btn-search-export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                if (!this.results || this.results.length === 0) return;
                this._exportPDF();
            });
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

        const exportPdfBtn = document.getElementById('btn-search-export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.disabled = this.results.length === 0;
        }
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

    /**
     * Génère et télécharge un PDF de tous les résultats de la recherche courante.
     */
    _exportPDF() {
        const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) {
            const msg = document.getElementById('search-message');
            if (msg) { msg.textContent = 'Bibliothèque PDF non chargée.'; msg.className = 'message message-error'; }
            return;
        }

        const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });
        const pageW  = 297;
        const pageH  = 210;
        const mX     = 12;
        const mY     = 12;
        const rowH   = 7;
        // Date, Heure, Nom, Prénom, Classe, Demi-j., Type, Statut, Raison
        const colW   = [28, 18, 34, 30, 22, 18, 28, 28, 35];
        const headers = ['Date', 'Heure', 'Nom', 'Prénom', 'Classe', 'Demi-j.', 'Type', 'Statut', 'Raison'];

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];

        // Filtres actifs pour le sous-titre
        const classe = document.getElementById('search-classe')?.value || '';
        const nom    = document.getElementById('search-name')?.value || '';
        const prenom = document.getElementById('search-surname')?.value || '';
        const statut = document.getElementById('search-statut')?.value || '';
        const filterParts = [
            classe && `Classe : ${classe}`,
            nom    && `Nom : ${nom}`,
            prenom && `Prénom : ${prenom}`,
            statut && `Statut : ${statut}`
        ].filter(Boolean);

        let y = mY;

        // Titre
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.text('Recherche étudiant — Résultats', mX, y);
        y += 7;

        // Sous-titre filtres
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(filterParts.length ? filterParts.join('   |   ') : 'Tous les étudiants', mX, y);
        y += 5;

        doc.setDrawColor(180, 180, 180);
        doc.line(mX, y, pageW - mX, y);
        y += 4;

        const drawHeader = () => {
            doc.setFillColor(44, 62, 80);
            doc.rect(mX, y, colW.reduce((a, b) => a + b, 0), rowH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            let x = mX;
            headers.forEach((h, i) => { doc.text(h, x + 2, y + rowH - 2); x += colW[i]; });
            y += rowH;
        };

        drawHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        this.results.forEach((passage, idx) => {
            if (y + rowH > pageH - mY) {
                doc.addPage('a4', 'landscape');
                y = mY;
                drawHeader();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
            }

            if (idx % 2 === 0) {
                doc.setFillColor(245, 247, 250);
                doc.rect(mX, y, colW.reduce((a, b) => a + b, 0), rowH, 'F');
            }

            const stat = passage.statut || '---';
            const cells = [
                passage.date_passage   || '---',
                passage.heure_passage  || '---',
                passage.nom            || '---',
                passage.prenom         || '---',
                passage.classe         || '---',
                String(Number(passage.total_demi_journees) || 0),
                passage.type_passage   || '---',
                stat,
                passage.raison || passage.reason || '---'
            ];

            let x = mX;
            cells.forEach((cell, i) => {
                if (i === 7) {
                    if (STATUT_ROUGE.includes(stat))      doc.setTextColor(192, 57, 43);
                    else if (STATUT_VERT.includes(stat))  doc.setTextColor(39, 174, 96);
                    else                                   doc.setTextColor(80, 80, 80);
                } else {
                    doc.setTextColor(31, 41, 55);
                }
                const truncated = doc.splitTextToSize(cell, colW[i] - 3)[0] || '';
                doc.text(truncated, x + 2, y + rowH - 2);
                x += colW[i];
            });

            doc.setDrawColor(220, 220, 220);
            doc.line(mX, y + rowH, mX + colW.reduce((a, b) => a + b, 0), y + rowH);
            y += rowH;
        });

        // Pied de page
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${p} / ${totalPages}`, pageW - mX - 20, pageH - 5);
            doc.text(`Exporté le ${new Date().toLocaleDateString('fr-BE')}`, mX, pageH - 5);
        }

        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        doc.save(`Recherche_etudiants_${today}.pdf`);
    }
}
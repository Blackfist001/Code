import '../vendor/jspdf.umd.min.js';

/**
 * Vue de la page historique des passages.
 * Affiche la liste paginée des passages et les statistiques agrégées sur la période.
 */
export default class HistoricalView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
        this.pageSize = 20;
        this.currentPage = 1;
        this.passages = [];
    }

    /**
     * Définit le contrôleur associé à cette vue.
     * @param {HistoricalController} controller
     */
    setController(controller) {
        this.controller = controller;
    }

    /**
     * Retourne les valeurs des champs de filtre de date.
     * @returns {{dateFrom: string, dateTo: string}}
     */
    _getDateRange() {
        return {
            dateFrom: document.getElementById('date-from')?.value || '',
            dateTo: document.getElementById('date-to')?.value || ''
        };
    }

    /**
     * Affiche ou masque un message de notification.
     * @param {string} [message=''] - Texte du message
     * @param {'info'|'warning'|'error'} [type='info'] - Type de message
     */
    showMessage(message = '', type = 'info') {
        const box = document.getElementById('historical-message');
        if (!box) return;

        box.textContent = message;
        box.className = `message message-${type}`;
    }

    /**
     * Charge le HTML de la page historique et lance le chargement des données.
     */
    render() {
        fetch('html/historical.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachEventListeners();
                // Charger les données par défaut
                if (this.controller) {
                    this.controller.loadPassages();
                }
            });
    }

    /**
     * Met à jour la liste des passages et réinitialise la pagination à la page 1.
     * @param {Array} [passages=[]] - Tableau des passages retourné par l'API
     */
    displayPassages(passages = []) {
        this.passages = Array.isArray(passages) ? passages : [];
        this.currentPage = 1;
        this._renderPassagesPage();
    }

    /**
     * Affiche la page courante de passages dans le tableau.
     */
    _renderPassagesPage() {
        const listContainer = document.getElementById('historical-passages-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (!this.passages || this.passages.length === 0) {
            listContainer.innerHTML = '<p class="historical-empty">Aucun passage enregistré pour cette période.</p>';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageItems = this.passages.slice(startIndex, endIndex);
        
        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];

        const header = document.createElement('div');
        header.className = 'historical-list-header';
        header.innerHTML = `
            <span class="historical-date">Date &amp; Heure</span>
            <span class="historical-student">Nom Prénom</span>
            <span class="historical-class">Classe</span>
            <span class="historical-type">Type</span>
            <span class="historical-status">Statut</span>
        `;
        listContainer.appendChild(header);

        const list = document.createElement('ul');
        list.className = 'historical-list';

        pageItems.forEach(passage => {
            const statut = passage.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : 'status-info';
            const typeLabel = passage.type_passage || '---';
            const typeClass = 'status-info';
            const item = document.createElement('li');
            item.className = 'historical-list-item';
            item.innerHTML = `
                <span class="historical-date">${passage.date_passage || '---'} ${passage.heure_passage || '---'}</span>
                <span class="historical-student">${passage.nom || '---'} ${passage.prenom || ''}</span>
                <span class="historical-class">${passage.classe || '---'}</span>
                <span class="historical-type"><span class="status-badge ${typeClass}">${typeLabel}</span></span>
                <span class="status-badge ${statutClass}">${statut}</span>
            `;
            list.appendChild(item);
        });

        listContainer.appendChild(list);
        this._renderPagination(listContainer, this.passages.length);
    }

    /**
     * Rend les boutons de pagination dans le conteneur spécifié.
     * @param {HTMLElement|null} container - Conteneur cible
     * @param {number} totalItems          - Nombre total d'éléments
     */
    _renderPagination(container, totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        if (totalPages <= 1) return;

        const pagination = document.createElement('div');
        pagination.className = 'list-pagination';

        const prevDisabled = this.currentPage <= 1 ? 'disabled' : '';
        const nextDisabled = this.currentPage >= totalPages ? 'disabled' : '';
        pagination.innerHTML = `
            <button type="button" id="historical-page-prev" ${prevDisabled}>Precedent</button>
            <span>Page ${this.currentPage} / ${totalPages}</span>
            <button type="button" id="historical-page-next" ${nextDisabled}>Suivant</button>
        `;

        container.appendChild(pagination);

        const prevBtn = document.getElementById('historical-page-prev');
        const nextBtn = document.getElementById('historical-page-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage -= 1;
                    this._renderPassagesPage();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage += 1;
                    this._renderPassagesPage();
                }
            });
        }
    }

    /**
     * Injecte les statistiques agrégées sur la période dans la section stats.
     * @param {Object} [stats={}] - Objet statistiques (absent_count, present_count…)
     */
    displayStats(stats = {}) {
        const statsContainer = document.getElementById('stats-container');
        if (!statsContainer) return;

        const orderedStats = [
            ['Absents', stats.absent_count || 0],
            ['Présents', stats.present_count || 0],
            ['Retards', stats.en_retard_count || 0],
            ['Sorties de midi autorisées', stats.autorise_count || 0],
            ['Sorties de midi refusées', stats.refuse_count || 0],
            ['Absences justifiées', stats.absence_justifiee_count || 0],
            ['Sorties justifiées', stats.sortie_justifiee_count || 0],
            ['Total passages', stats.total_passages || 0]
        ].map(([label, value]) => `
                <div class="stat-item">
                    <span>${label}: ${value}</span>
                </div>
            `).join('');
        
        const html = `
            <div class="stats-grid">
                ${orderedStats}
            </div>
        `;
        statsContainer.innerHTML = html;
    }

    /**
     * Branche les écouteurs sur les filtres de date et déclenche le chargement des données.
     */
    attachEventListeners() {
        const filterBtn = document.getElementById('btn-filter-dates');
        if (filterBtn && this.controller) {
            filterBtn.addEventListener('click', () => {
                const { dateFrom, dateTo } = this._getDateRange();
                this.showMessage('');

                // Les deux vides = retour à la vue complète par défaut.
                if (!dateFrom && !dateTo) {
                    this.controller.loadPassages();
                    return;
                }

                // Une seule date n'est pas une plage valide.
                if (!dateFrom || !dateTo) {
                    this.showMessage('Veuillez sélectionner une date de début et une date de fin', 'warning');
                    return;
                }

                this.controller.loadPassages(dateFrom, dateTo);
            });
        }

        const exportBtn = document.getElementById('btn-export-csv');
        if (exportBtn && this.controller) {
            exportBtn.addEventListener('click', () => {
                const { dateFrom, dateTo } = this._getDateRange();
                this.showMessage('');
                if (dateFrom && dateTo) {
                    this.controller.exportCSV(dateFrom, dateTo);
                } else {
                    this.showMessage('Veuillez sélectionner une plage de dates', 'warning');
                }
            });
        }

        const exportPdfBtn = document.getElementById('btn-export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                const { dateFrom, dateTo } = this._getDateRange();
                this.showMessage('');
                if (!dateFrom || !dateTo) {
                    this.showMessage('Veuillez sélectionner une plage de dates', 'warning');
                    return;
                }
                if (!this.passages || this.passages.length === 0) {
                    this.showMessage('Aucun passage à exporter.', 'warning');
                    return;
                }
                this._exportPDF(dateFrom, dateTo);
            });
        }
    }

    /**
     * Génère et télécharge un PDF de la liste des passages filtrée.
     * @param {string} dateFrom - Date de début (Y-m-d)
     * @param {string} dateTo   - Date de fin (Y-m-d)
     */
    _exportPDF(dateFrom, dateTo) {
        const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) {
            this.showMessage('Bibliothèque PDF non chargée.', 'error');
            return;
        }

        const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });
        const pageW = 297;
        const pageH = 210;
        const marginX = 12;
        const marginY = 12;
        const rowH = 7;
        const colWidths = [38, 50, 28, 30, 30]; // Date, Nom, Classe, Type, Statut
        const headers = ['Date & Heure', 'Nom Prénom', 'Classe', 'Type', 'Statut'];

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];

        let y = marginY;

        // Titre
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.text('Historique des présences', marginX, y);
        y += 7;

        // Sous-titre période
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Période : ${dateFrom}  →  ${dateTo}`, marginX, y);
        y += 5;

        // Ligne de séparation
        doc.setDrawColor(180, 180, 180);
        doc.line(marginX, y, pageW - marginX, y);
        y += 4;

        const drawHeader = () => {
            doc.setFillColor(44, 62, 80);
            doc.rect(marginX, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            let x = marginX;
            headers.forEach((h, i) => {
                doc.text(h, x + 2, y + rowH - 2);
                x += colWidths[i];
            });
            y += rowH;
        };

        drawHeader();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);

        this.passages.forEach((passage, idx) => {
            // Nouvelle page si besoin
            if (y + rowH > pageH - marginY) {
                doc.addPage('a4', 'landscape');
                y = marginY;
                drawHeader();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
            }

            // Fond alterné
            if (idx % 2 === 0) {
                doc.setFillColor(245, 247, 250);
                doc.rect(marginX, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'F');
            }

            const statut = passage.statut || '---';
            const cells = [
                `${passage.date_passage || '---'} ${passage.heure_passage || ''}`.trim(),
                `${passage.nom || '---'} ${passage.prenom || ''}`.trim(),
                passage.classe || '---',
                passage.type_passage || '---',
                statut
            ];

            let x = marginX;
            cells.forEach((cell, i) => {
                if (i === 4) {
                    // Couleur statut
                    if (STATUT_ROUGE.includes(statut)) doc.setTextColor(192, 57, 43);
                    else if (STATUT_VERT.includes(statut)) doc.setTextColor(39, 174, 96);
                    else doc.setTextColor(80, 80, 80);
                } else {
                    doc.setTextColor(31, 41, 55);
                }
                const truncated = doc.splitTextToSize(cell, colWidths[i] - 3)[0] || '';
                doc.text(truncated, x + 2, y + rowH - 2);
                x += colWidths[i];
            });

            // Bordure basse légère
            doc.setDrawColor(220, 220, 220);
            doc.line(marginX, y + rowH, marginX + colWidths.reduce((a, b) => a + b, 0), y + rowH);

            y += rowH;
        });

        // Pied de page
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${p} / ${totalPages}`, pageW - marginX - 20, pageH - 5);
            doc.text(`Exporté le ${new Date().toLocaleDateString('fr-BE')}`, marginX, pageH - 5);
        }

        const safeDateFrom = dateFrom.replace(/-/g, '');
        const safeDateTo   = dateTo.replace(/-/g, '');
        doc.save(`Historique_présences_${safeDateFrom}_${safeDateTo}.pdf`);
    }
}
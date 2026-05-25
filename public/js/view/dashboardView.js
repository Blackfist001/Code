import '../vendor/jspdf.umd.min.js';

/**
 * Vue du tableau de bord.
 * Affiche les statistiques du jour et les derniers passages.
 */
export default class DashboardView {

    constructor() {
        this.container = document.getElementById('container');
        this.criticalAbsenceStudents = [];
        this.criticalClassFilter = 'all';
        this.criticalSortBy = 'demi_desc';
        this._isEscapeHandlerBound = false;
    }

    /**
     * Charge le HTML du dashboard, puis peuple les statistiques et les passages.
     * @param {Object} [stats={}]      - Statistiques du jour
     * @param {Array}  [movements=[]] - Derniers passages
     */
    render(stats = {}, movements = []) {
        fetch('html/dashboard.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.populateStats(stats);
                this.populateMovements(movements);
            });
    }

    /**
     * Affiche ou masque un message dans la zone de notification du dashboard.
     * @param {string} [message=''] - Texte du message
     * @param {'info'|'warning'|'error'} [type='info'] - Type de message
     */
    showMessage(message = '', type = 'info') {
        if (!message) return;
        if (window.AppNotifier && typeof window.AppNotifier.notify === 'function') {
            window.AppNotifier.notify(message, type);
            return;
        }

        const box = document.getElementById('dashboard-message');
        if (!box) return;
        box.textContent = message;
        box.className = message ? `message message-${type}` : 'message';
    }

    /**
     * Injecte les statistiques agrégées dans la grille de stats.
     * @param {Object} stats - Objet contenant les compteurs (absent_count, present_count, etc.)
     */
    populateStats(stats) {
        const statsContainer = document.getElementById('dashboard-stats-container');
        if (!statsContainer) return;

        this.criticalAbsenceStudents = Array.isArray(stats.critical_absence_students)
            ? stats.critical_absence_students
            : [];
        this.criticalClassFilter = 'all';
        this.criticalSortBy = 'demi_desc';

        const criticalCount = Number(stats.critical_absence_count || this.criticalAbsenceStudents.length || 0);

        const orderedStats = [
            ['Total étudiants', stats.total_students || 0],
            ['Absents', stats.absent_count || stats.absent_today || 0],
            ['Présents', stats.present_count || stats.present_today || 0],
            ['Retards', stats.en_retard_count || 0],
            ['Sorties de midi autorisées', stats.autorise_count || 0],
            ['Sorties de midi refusées', stats.refuse_count || 0],
            ['Absences justifiées', stats.absence_justifiee_count || 0],
            ['Sorties justifiées', stats.sortie_justifiee_count || 0],
            ['Total passages', stats.total_passages || stats.total_scans || 0]
        ].map(([label, value]) => `
                <div class="stat-item">
                    <span>${label}: ${value}</span>
                </div>
            `).join('');

        const criticalAbsenceItem = `
            <button type="button" id="dashboard-critical-alert" class="stat-item stat-item-alert" title="Afficher les étudiants concernés">
                <span>Alerte absences (>= 9 demi-journées): ${criticalCount}</span>
            </button>
        `;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                ${orderedStats}
                ${criticalAbsenceItem}
            </div>
            ${this._buildCriticalAbsenceModal()}
        `;

        this._bindCriticalAbsenceEvents();
    }

    updateStats(stats) {
        this.populateStats(stats);
    }

    /**
     * Peuple le tableau des 10 derniers passages.
     * @param {Array} movements - Liste des passages
     */
    populateMovements(movements) {
        const tbody = document.getElementById('movements-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        const latestMovements = Array.isArray(movements) ? movements : [];

        if (!latestMovements.length) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun passage enregistré</td></tr>';
            return;
        }

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];

        latestMovements.slice(0, 10).forEach(movement => {
            const statut = movement.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : 'status-info';
            const typeLabel = movement.type_passage || '---';
            const typeClass = 'status-info';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movement.date_passage || '---'}</td>
                <td>${movement.heure_passage || '---'}</td>
                <td>${movement.nom || '---'}</td>
                <td>${movement.prenom || '---'}</td>
                <td>${movement.classe || '---'}</td>
                <td><span class="status-badge ${typeClass}">${typeLabel}</span></td>
                <td><span class="status-badge ${statutClass}">${statut}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateMovements(movements) {
        this.populateMovements(movements);
    }

    _buildCriticalAbsenceModal() {
        const classes = this._getCriticalClassOptions();
        const filterOptions = ['<option value="all">Toutes les classes</option>']
            .concat(classes.map((classe) => `<option value="${this._escapeHtml(classe)}">${this._escapeHtml(classe)}</option>`))
            .join('');

        return `
            <div id="dashboard-critical-modal" class="dashboard-modal-overlay" aria-hidden="true">
                <div class="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-critical-title">
                    <div class="dashboard-modal-header">
                        <h4 id="dashboard-critical-title">Etudiants ayant minimum 9 demi-journées d'absence</h4>
                        <div class="dashboard-modal-actions">
                            <button type="button" id="dashboard-critical-export-csv">Export CSV</button>
                            <button type="button" id="dashboard-critical-export-pdf">Export PDF</button>
                            <button type="button" id="dashboard-critical-close" class="dashboard-modal-close">Fermer</button>
                        </div>
                    </div>
                    <div class="dashboard-modal-body">
                        <div class="dashboard-critical-toolbar">
                            <label for="dashboard-critical-filter-class">Classe</label>
                            <select id="dashboard-critical-filter-class">
                                ${filterOptions}
                            </select>
                            <label for="dashboard-critical-sort">Tri</label>
                            <select id="dashboard-critical-sort">
                                <option value="demi_desc">Demi-journées (décroissant)</option>
                                <option value="demi_asc">Demi-journées (croissant)</option>
                                <option value="nom_asc">Nom (A-Z)</option>
                                <option value="prenom_asc">Prénom (A-Z)</option>
                                <option value="classe_asc">Classe (A-Z)</option>
                            </select>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Classe</th>
                                    <th>Demi-journées</th>
                                </tr>
                            </thead>
                            <tbody id="dashboard-critical-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    _bindCriticalAbsenceEvents() {
        const alertButton = document.getElementById('dashboard-critical-alert');
        const modal = document.getElementById('dashboard-critical-modal');
        const closeButton = document.getElementById('dashboard-critical-close');
        const exportCsvButton = document.getElementById('dashboard-critical-export-csv');
        const exportPdfButton = document.getElementById('dashboard-critical-export-pdf');
        const classFilter = document.getElementById('dashboard-critical-filter-class');
        const sortSelect = document.getElementById('dashboard-critical-sort');

        if (alertButton && modal) {
            alertButton.addEventListener('click', () => this._openCriticalModal());
            alertButton.disabled = this.criticalAbsenceStudents.length === 0;
        }

        if (classFilter) {
            classFilter.value = this.criticalClassFilter;
            classFilter.addEventListener('change', (event) => {
                this.criticalClassFilter = event.target.value || 'all';
                this._renderCriticalAbsenceRows();
            });
        }

        if (sortSelect) {
            sortSelect.value = this.criticalSortBy;
            sortSelect.addEventListener('change', (event) => {
                this.criticalSortBy = event.target.value || 'demi_desc';
                this._renderCriticalAbsenceRows();
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this._closeCriticalModal());
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this._closeCriticalModal();
                }
            });
        }

        if (!this._isEscapeHandlerBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this._closeCriticalModal();
                }
            });
            this._isEscapeHandlerBound = true;
        }

        if (exportCsvButton) {
            exportCsvButton.addEventListener('click', () => this._exportCriticalAbsenceCSV());
        }

        if (exportPdfButton) {
            exportPdfButton.addEventListener('click', () => this._exportCriticalAbsencePDF());
        }

        this._renderCriticalAbsenceRows();
    }

    _openCriticalModal() {
        const modal = document.getElementById('dashboard-critical-modal');
        if (!modal) return;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    _closeCriticalModal() {
        const modal = document.getElementById('dashboard-critical-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    _exportCriticalAbsenceCSV() {
        const exportRows = this._getDisplayedCriticalStudents();
        if (!exportRows.length) {
            this.showMessage('Aucune donnée à exporter.', 'warning');
            return;
        }

        const headers = ['Nom', 'Prenom', 'Classe', 'Demi-journees'];
        const rows = exportRows.map((student) => [
            student.nom || '',
            student.prenom || '',
            student.classe || '',
            String(Number(student.demi_journee_absence || 0))
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((value) => {
                const safe = String(value).replace(/"/g, '""');
                return `"${safe}"`;
            }).join(';'))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `etudiants_absences_9_demi_journees_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    _exportCriticalAbsencePDF() {
        const exportRows = this._getDisplayedCriticalStudents();
        if (!exportRows.length) {
            this.showMessage('Aucune donnée à exporter.', 'warning');
            return;
        }

        const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) {
            this.showMessage('Bibliothèque PDF non chargée.', 'error');
            return;
        }

        const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
        const pageHeight = 297;
        const marginX = 14;
        const marginY = 16;
        const rowHeight = 8;
        const colWidths = [50, 50, 45, 35];
        const headers = ['Nom', 'Prénom', 'Classe', 'Demi-journées'];
        let y = marginY;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text("Etudiants ayant minimum 9 demi-journées d'absence", marginX, y);
        y += 10;

        const drawHeader = () => {
            doc.setFillColor(44, 62, 80);
            doc.rect(marginX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);

            let x = marginX;
            headers.forEach((header, index) => {
                doc.text(header, x + 2, y + rowHeight - 2.5);
                x += colWidths[index];
            });
            y += rowHeight;
        };

        drawHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        exportRows.forEach((student, index) => {
            if (y + rowHeight > pageHeight - marginY) {
                doc.addPage();
                y = marginY;
                drawHeader();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
            }

            if (index % 2 === 0) {
                doc.setFillColor(245, 247, 250);
                doc.rect(marginX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
            }

            const values = [
                student.nom || '---',
                student.prenom || '---',
                student.classe || '---',
                String(Number(student.demi_journee_absence || 0))
            ];

            let x = marginX;
            values.forEach((value, colIndex) => {
                doc.setTextColor(31, 41, 55);
                const cellText = doc.splitTextToSize(String(value), colWidths[colIndex] - 4)[0] || '---';
                doc.text(cellText, x + 2, y + rowHeight - 2.5);
                x += colWidths[colIndex];
            });

            doc.setDrawColor(220, 220, 220);
            doc.line(marginX, y + rowHeight, marginX + colWidths.reduce((a, b) => a + b, 0), y + rowHeight);
            y += rowHeight;
        });

        doc.save(`etudiants_absences_9_demi_journees_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    _renderCriticalAbsenceRows() {
        const tbody = document.getElementById('dashboard-critical-tbody');
        const exportCsvButton = document.getElementById('dashboard-critical-export-csv');
        const exportPdfButton = document.getElementById('dashboard-critical-export-pdf');
        if (!tbody) return;

        const rows = this._getDisplayedCriticalStudents();
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="4">Aucun étudiant concerné</td></tr>';
            if (exportCsvButton) exportCsvButton.disabled = true;
            if (exportPdfButton) exportPdfButton.disabled = true;
            return;
        }

        tbody.innerHTML = rows.map((student) => `
            <tr>
                <td>${this._escapeHtml(student.nom || '---')}</td>
                <td>${this._escapeHtml(student.prenom || '---')}</td>
                <td>${this._escapeHtml(student.classe || '---')}</td>
                <td>${Number(student.demi_journee_absence || 0)}</td>
            </tr>
        `).join('');

        if (exportCsvButton) exportCsvButton.disabled = false;
        if (exportPdfButton) exportPdfButton.disabled = false;
    }

    _getDisplayedCriticalStudents() {
        const currentClassFilter = String(this.criticalClassFilter || 'all');
        const currentSortBy = String(this.criticalSortBy || 'demi_desc');

        let rows = [...this.criticalAbsenceStudents];
        if (currentClassFilter !== 'all') {
            rows = rows.filter((student) => String(student.classe || '') === currentClassFilter);
        }

        const compareText = (a, b) => String(a || '').localeCompare(String(b || ''), 'fr', { sensitivity: 'base' });
        const compareDemi = (a, b) => Number(a?.demi_journee_absence || 0) - Number(b?.demi_journee_absence || 0);

        switch (currentSortBy) {
            case 'demi_asc':
                rows.sort((a, b) => compareDemi(a, b));
                break;
            case 'nom_asc':
                rows.sort((a, b) => compareText(a?.nom, b?.nom));
                break;
            case 'prenom_asc':
                rows.sort((a, b) => compareText(a?.prenom, b?.prenom));
                break;
            case 'classe_asc':
                rows.sort((a, b) => compareText(a?.classe, b?.classe));
                break;
            case 'demi_desc':
            default:
                rows.sort((a, b) => compareDemi(b, a));
                break;
        }

        return rows;
    }

    _getCriticalClassOptions() {
        return [...new Set(
            this.criticalAbsenceStudents
                .map((student) => String(student.classe || '').trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }

    _escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
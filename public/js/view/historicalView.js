export default class HistoricalView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
    }

    setController(controller) {
        this.controller = controller;
    }

    _getDateRange() {
        return {
            dateFrom: document.getElementById('date-from')?.value || '',
            dateTo: document.getElementById('date-to')?.value || ''
        };
    }

    showMessage(message = '', type = 'info') {
        const box = document.getElementById('historical-message');
        if (!box) return;

        box.textContent = message;
        box.className = `message message-${type}`;
    }

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

    displayPassages(passages = []) {
        const listContainer = document.getElementById('historical-passages-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (!passages || passages.length === 0) {
            listContainer.innerHTML = '<p class="historical-empty">Aucun passage enregistré pour cette période.</p>';
            return;
        }
        
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

        passages.slice(0, 50).forEach(passage => {
            const statut = passage.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : '';
            const item = document.createElement('li');
            item.className = 'historical-list-item';
            item.innerHTML = `
                <span class="historical-date">${passage.date_passage || '---'} ${passage.heure_passage || '---'}</span>
                <span class="historical-student">${passage.nom || '---'} ${passage.prenom || ''}</span>
                <span class="historical-class">${passage.classe || '---'}</span>
                <span class="historical-type">${passage.type_passage || '---'}</span>
                <span class="status-badge ${statutClass}">${statut}</span>
            `;
            list.appendChild(item);
        });

        listContainer.appendChild(list);
    }

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
    }
}
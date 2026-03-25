export default class HistoricalView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
    }

    setController(controller) {
        this.controller = controller;
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
        const tbody = document.getElementById('passages-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!passages || passages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun passage enregistré</td></tr>';
            return;
        }
        
        passages.slice(0, 50).forEach(passage => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${passage.date_passage || '---'}</td>
                <td>${passage.heure_passage || '---'}</td>
                <td>${passage.nom || '---'}</td>
                <td>${passage.prenom || '---'}</td>
                <td>${passage.classe || '---'}</td>
                <td>${passage.type_passage || '---'}</td>
                <td class="status-ok">${passage.statut || '---'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    displayStats(stats = {}) {
        const statsContainer = document.getElementById('stats-container');
        if (!statsContainer) return;
        
        const html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span>Total passages: ${stats.total_passages || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Absents: ${stats.absent_count || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Présents: ${stats.present_count || 0}</span>
                </div>
            </div>
        `;
        statsContainer.innerHTML = html;
    }

    attachEventListeners() {
        const filterBtn = document.getElementById('btn-filter-dates');
        if (filterBtn && this.controller) {
            filterBtn.addEventListener('click', () => {
                const dateFrom = document.getElementById('date-from').value;
                const dateTo = document.getElementById('date-to').value;
                if (dateFrom && dateTo) {
                    this.controller.getStatsByDate(dateFrom, dateTo);
                    this.controller.loadPassages(dateFrom, dateTo);
                }
            });
        }

        const exportBtn = document.getElementById('btn-export-csv');
        if (exportBtn && this.controller) {
            exportBtn.addEventListener('click', () => {
                const dateFrom = document.getElementById('date-from').value;
                const dateTo = document.getElementById('date-to').value;
                if (dateFrom && dateTo) {
                    this.controller.exportCSV(dateFrom, dateTo);
                } else {
                    alert('Veuillez sélectionner une plage de dates');
                }
            });
        }
    }
}
export default class DashboardView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render(stats = {}, movements = []) {
        fetch('html/dashboard.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.populateStats(stats);
                this.populateMovements(movements);
                this.attachEventListeners();
            });
    }

    populateStats(stats) {
        if (document.getElementById('total-students')) {
            document.getElementById('total-students').textContent = stats.total_students || 0;
        }
        if (document.getElementById('present-count')) {
            document.getElementById('present-count').textContent = stats.present_today || 0;
        }
        if (document.getElementById('absent-count')) {
            document.getElementById('absent-count').textContent = stats.absent_today || 0;
        }
        if (document.getElementById('total-scans')) {
            document.getElementById('total-scans').textContent = stats.total_scans || 0;
        }
    }

    populateMovements(movements) {
        const tbody = document.getElementById('movements-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!movements || movements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Aucun passage enregistré</td></tr>';
            return;
        }

        const STATUT_ROUGE = ['absent', 'refuse', 'en_retard'];
        const STATUT_VERT  = ['present', 'autorise'];

        movements.slice(0, 10).forEach(movement => {
            const statut = movement.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : '';
            const statutLabels = {
                present:          'Présent',
                autorise:         'Autorisé',
                refuse:           'Refusé',
                absent:           'Absent',
                en_retard:        'En retard',
                absence_justifie: 'Absence justifiée',
                sortie_justifie:  'Sortie justifiée',
            };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movement.date_passage || '---'}</td>
                <td>${movement.heure_passage || '---'}</td>
                <td>${movement.nom || '---'}</td>
                <td>${movement.classe || '---'}</td>
                <td>${movement.type_passage || '---'}</td>
                <td><span class="status-badge ${statutClass}">${statutLabels[statut] ?? statut}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateMovements(movements) {
        this.populateMovements(movements);
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('btn-refresh-stats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Refresh stats clicked');
                window.dispatchEvent(new CustomEvent('refresh-dashboard'));
            });
        }
    }
}
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
            });
    }

    showMessage(message = '', type = 'info') {
        const box = document.getElementById('dashboard-message');
        if (!box) return;

        box.textContent = message;
        box.className = message ? `message message-${type}` : 'message';
    }

    populateStats(stats) {
        const statsContainer = document.getElementById('dashboard-stats-container');
        if (!statsContainer) return;

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

        statsContainer.innerHTML = `
            <div class="stats-grid">
                ${orderedStats}
            </div>
        `;
    }

    populateMovements(movements) {
        const tbody = document.getElementById('movements-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        const dayMovements = (movements || []).filter(movement =>
            String(movement.type_passage || '').toLowerCase() === 'journée'
        );
        
        if (!dayMovements.length) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun passage enregistré</td></tr>';
            return;
        }

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];

        dayMovements.slice(0, 10).forEach(movement => {
            const statut = movement.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movement.date_passage || '---'}</td>
                <td>${movement.heure_passage || '---'}</td>
                <td>${movement.nom || '---'}</td>
                <td>${movement.prenom || '---'}</td>
                <td>${movement.classe || '---'}</td>
                <td>${movement.type_passage || '---'}</td>
                <td><span class="status-badge ${statutClass}">${statut}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateMovements(movements) {
        this.populateMovements(movements);
    }
}
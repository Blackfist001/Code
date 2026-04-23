/**
 * Vue du tableau de bord.
 * Affiche les statistiques du jour et les derniers passages.
 */
export default class DashboardView {

    constructor() {
        this.container = document.getElementById('container');
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

    /**
     * Peuple le tableau des derniers passages (type 'Journée' uniquement).
     * @param {Array} movements - Liste des passages
     */
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
}
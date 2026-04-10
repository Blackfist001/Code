import DashboardView from "../view/dashboardView.js";
import api from "../api.js";

export default class DashboardController {

    constructor() {
        this.view = new DashboardView();
        this.stats = {};
        this.movements = [];
    }

    async loadDashboard() {
        try {
            const [statsResponse, movementsResponse] = await Promise.all([
                api.getStats(),
                api.getAllMovements()
            ]);

            const warnings = [];

            if (statsResponse.success) {
                this.stats = statsResponse;
            } else {
                warnings.push(statsResponse.message || 'Impossible de charger les statistiques');
            }

            if (movementsResponse && Array.isArray(movementsResponse)) {
                this.movements = movementsResponse;
            } else if (movementsResponse && movementsResponse.results) {
                this.movements = movementsResponse.results;
            } else {
                warnings.push('Impossible de charger les derniers passages');
            }

            // Afficher la vue
            this.view.render(this.stats, this.movements);

            if (warnings.length > 0) {
                setTimeout(() => {
                    this.view.showMessage(warnings.join(' | '), 'warning');
                }, 0);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
            this.view.render(this.stats, this.movements);
            setTimeout(() => {
                this.view.showMessage('Erreur lors du chargement du dashboard', 'error');
            }, 0);
        }
    }
}
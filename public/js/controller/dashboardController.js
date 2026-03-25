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
            // Charger les données depuis l'API
            const statsResponse = await api.request('php/api/getStats.php' || '../../../api.php', {
                method: 'GET'
            });
            
            if (statsResponse.success) {
                this.stats = statsResponse;
            }

            // Charger les passages récents
            const movementsResponse = await api.request('getAllMovements.php');
            if (movementsResponse.success) {
                this.movements = movementsResponse.results || [];
            }

            // Afficher la vue
            this.view.render(this.stats, this.movements);
        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
        }
    }

    async refreshStats() {
        try {
            const response = await api.request('getAllMovements.php');
            if (response.success) {
                this.movements = response.results || [];
                this.view.updateMovements(this.movements);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
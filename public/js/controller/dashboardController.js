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
            const statsResponse = await api.getStats();

            if (statsResponse.success) {
                this.stats = statsResponse;
            }

            // Charger les passages récents
            const movementsResponse = await api.getAllMovements();
            if (movementsResponse && Array.isArray(movementsResponse)) {
                this.movements = movementsResponse;
            } else if (movementsResponse && movementsResponse.results) {
                this.movements = movementsResponse.results;
            }

            // Afficher la vue
            this.view.render(this.stats, this.movements);
        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
        }
    }

    async refreshStats() {
        try {
            const response = await api.getAllMovements();
            if (response && Array.isArray(response)) {
                this.movements = response;
            } else if (response && response.results) {
                this.movements = response.results;
            }
            this.view.updateMovements(this.movements);
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
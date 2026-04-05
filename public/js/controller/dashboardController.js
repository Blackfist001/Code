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

            if (statsResponse.success) {
                this.stats = statsResponse;
            }

            if (movementsResponse && Array.isArray(movementsResponse)) {
                this.movements = movementsResponse;
            } else if (movementsResponse && movementsResponse.results) {
                this.movements = movementsResponse.results;
            }

            // Afficher la vue puis brancher le bouton via l'événement
            this.view.render(this.stats, this.movements);
            this._listenRefresh();
        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
        }
    }

    _listenRefresh() {
        // Supprimer l'ancien listener pour éviter les doublons si loadDashboard est rappelé
        window.removeEventListener('refresh-dashboard', this._onRefresh);
        this._onRefresh = () => this.refreshStats();
        window.addEventListener('refresh-dashboard', this._onRefresh);
    }

    async refreshStats() {
        try {
            const [statsResponse, movementsResponse] = await Promise.all([
                api.getStats(),
                api.getAllMovements()
            ]);

            if (statsResponse.success) {
                this.stats = statsResponse;
                this.view.populateStats(this.stats);
            }

            if (movementsResponse && Array.isArray(movementsResponse)) {
                this.movements = movementsResponse;
            } else if (movementsResponse && movementsResponse.results) {
                this.movements = movementsResponse.results;
            }
            this.view.updateMovements(this.movements);
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
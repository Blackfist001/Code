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

            // Afficher la vue puis brancher le bouton via l'événement
            this.view.render(this.stats, this.movements);
            this._listenRefresh();

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
                this.view.showMessage('Statistiques mises à jour', 'info');
            } else {
                this.view.showMessage(statsResponse.message || 'Impossible de mettre à jour les statistiques', 'warning');
            }

            if (movementsResponse && Array.isArray(movementsResponse)) {
                this.movements = movementsResponse;
            } else if (movementsResponse && movementsResponse.results) {
                this.movements = movementsResponse.results;
            } else {
                this.view.showMessage('Impossible de mettre à jour les passages', 'warning');
            }
            this.view.updateMovements(this.movements);
        } catch (error) {
            console.error('Erreur:', error);
            this.view.showMessage('Erreur pendant l\'actualisation du dashboard', 'error');
        }
    }
}
import HistoricalView from "../view/historicalView.js";
import api from "../api.js";

/**
 * Contrôleur de la page historique des passages.
 * Gère le chargement, le filtrage par date et l'export CSV.
 */
export default class HistoricalController {

    constructor() {
        this.view = new HistoricalView();
        this.view.setController(this);
    }

    /**
     * Charge la page historique (rendu initial).
     */
    loadHistorical() {
        this.view.render();
    }

    /**
     * Charge les passages pour une période donnée et met à jour la vue.
     * @param {string|null} [dateFrom] - Date de début (Y-m-d). Par défaut : 1er jour du mois précédent.
     * @param {string|null} [dateTo]   - Date de fin (Y-m-d). Par défaut : aujourd'hui.
     * @returns {Promise<void>}
     */
    async loadPassages(dateFrom = null, dateTo = null) {
        try {
            const response = await api.getPassages(dateFrom, dateTo);
            
            if (response.success) {
                this.view.displayPassages(response.results);
            } else {
                this.view.showMessage(response.message || 'Impossible de charger les passages', 'error');
            }

            // Toujours calculer les stats sur la même plage
            const statsFrom = dateFrom || this._defaultDateFrom();
            const statsTo   = dateTo   || this._defaultDateTo();
            await this.getStatsByDate(statsFrom, statsTo);
        } catch (error) {
            console.error('Erreur:', error);
            this.view.showMessage('Erreur lors du chargement des données historiques', 'error');
        }
    }

    /**
     * Retourne la date de début par défaut (1er jour du mois précédent, format Y-m-d).
     * @returns {string}
     */
    _defaultDateFrom() {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        return d.toISOString().split('T')[0];
    }

    /**
     * Retourne la date de fin par défaut (aujourd'hui, format Y-m-d).
     * @returns {string}
     */
    _defaultDateTo() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Charge les statistiques agregées pour une période et met à jour la vue.
     * @param {string} dateFrom - Date de début (Y-m-d)
     * @param {string} dateTo   - Date de fin (Y-m-d)
     * @returns {Promise<void>}
     */
    async getStatsByDate(dateFrom, dateTo) {
        try {
            const response = await api.getStatsByDate(dateFrom, dateTo);
            
            if (response.success) {
                const rows = Array.isArray(response.results) ? response.results : [];
                const totalPassages = rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
                const statusCounts = {
                    autorise_count: rows.reduce((sum, row) => sum + (Number(row.autorise_count) || 0), 0),
                    refuse_count: rows.reduce((sum, row) => sum + (Number(row.refuse_count) || 0), 0),
                    absence_justifiee_count: rows.reduce((sum, row) => sum + (Number(row.absence_justifiee_count) || 0), 0),
                    sortie_justifiee_count: rows.reduce((sum, row) => sum + (Number(row.sortie_justifiee_count) || 0), 0),
                    absent_count: rows.reduce((sum, row) => sum + (Number(row.absent_count) || 0), 0),
                    en_retard_count: rows.reduce((sum, row) => sum + (Number(row.en_retard_count) || 0), 0),
                    present_status_count: rows.reduce((sum, row) => sum + (Number(row.present_count) || 0), 0)
                };

                this.view.displayStats({
                    total_passages: totalPassages,
                    absent_count: statusCounts.absent_count,
                    present_count: statusCounts.present_status_count,
                    ...statusCounts
                });
            } else {
                this.view.showMessage(response.message || 'Impossible de charger les statistiques', 'warning');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.view.showMessage('Erreur lors du chargement des statistiques', 'error');
        }
    }

    /**
     * Déclenche le téléchargement de l'export CSV des passages pour la période donnée.
     * @param {string} dateFrom - Date de début (Y-m-d)
     * @param {string} dateTo   - Date de fin (Y-m-d)
     */
    async exportCSV(dateFrom, dateTo) {
        try {
            const params = new URLSearchParams({
                date_from: dateFrom,
                date_to: dateTo
            });
            const url = `/api/export/csv?${params.toString()}`;
            window.location.assign(url);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.view.showMessage('Erreur lors de l\'export CSV', 'error');
        }
    }
}
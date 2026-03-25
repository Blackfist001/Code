import HistoricalView from "../view/historicalView.js";
import api from "../api.js";

export default class HistoricalController {

    constructor() {
        this.view = new HistoricalView();
        this.view.setController(this);
    }

    loadHistorical() {
        this.view.render();
    }

    async loadPassages(dateFrom = null, dateTo = null) {
        try {
            let endpoint = 'getPassages.php';
            
            if (dateFrom && dateTo) {
                endpoint += `?date_from=${dateFrom}&date_to=${dateTo}`;
            }
            
            const response = await api.request(endpoint);
            
            if (response.success) {
                this.view.displayPassages(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async getStatsByDate(dateFrom, dateTo) {
        try {
            const response = await api.request(`getStatsByDate.php?date_from=${dateFrom}&date_to=${dateTo}`);
            
            if (response.success) {
                this.view.displayStats(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async exportCSV(dateFrom, dateTo) {
        window.location.href = `php/api/exportCSV.php?date_from=${dateFrom}&date_to=${dateTo}`;
    }
}
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
            const response = await api.getPassages(dateFrom, dateTo);
            
            if (response.success) {
                this.view.displayPassages(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async getStatsByDate(dateFrom, dateTo) {
        try {
            const response = await api.getStatsByDate(dateFrom, dateTo);
            
            if (response.success) {
                this.view.displayStats(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async exportCSV(dateFrom, dateTo) {
        try {
            const blob = await api.exportCSV(dateFrom, dateTo);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `passages_${dateFrom}_${dateTo}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            alert('Erreur lors de l\'export CSV');
        }
    }
}
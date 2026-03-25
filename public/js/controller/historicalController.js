import HistoricalView from "../view/historicalView.js";

export default class HistoricalController {

    constructor() {
        this.view = new HistoricalView();
    }

    loadHistorical() {
        this.view.render();
    }
}
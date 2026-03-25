import DashboardView from "../view/dashboardView.js";

export default class DashboardController {

    constructor() {
        this.view = new DashboardView();
    }

    loadDashboard() {
        this.view.render();
    }
}
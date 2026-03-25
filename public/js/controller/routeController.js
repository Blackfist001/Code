import DashboardController from './dashboardController.js';
import AbsentController from './absentController.js';
import ScanController from './scanController.js';
import ManualEncodingController from './manualEncodingController.js';
import JustifiedOutingsController from './justifiedOutingsController.js';
import SearchController from './searchController.js';
import HistoricalController from './historicalController.js';
import GestionController from './gestionController.js';

export default class RouteController {

    constructor() {
        this.routes = {
            'dashboard': this.loadDashboard,
            'scan': this.loadScan,
            'manualEncoding': this.loadManualEncoding,
            'absent': this.loadAbsent,
            'justifiedOutings': this.loadJustifiedOutings,
            'search': this.loadSearch,
            'historical': this.loadHistorical,
            'gestion': this.loadGestion,
            'logout': this.logout
        };
    }

    navigate(route) {
        if(this.routes.hasOwnProperty(route)) {
            switch(route) {
                case 'logout':
                    this.logout();
                    break;
                case 'dashboard':
                    let dashboardController = new DashboardController();
                    dashboardController.loadDashboard();
                    break;
                case 'scan':
                    let scanController = new ScanController();
                    scanController.loadScan();
                    break;
                case 'manualEncoding':
                    let manualEncodingController = new ManualEncodingController();
                    manualEncodingController.loadManualEncoding();
                    break;
                case 'absent':
                    let absentController = new AbsentController();
                    absentController.loadAbsent();
                    break;
                case 'justifiedOutings':
                    let justifiedOutingsController = new JustifiedOutingsController();
                    justifiedOutingsController.loadJustifiedOutings();
                    break;
                case 'search':
                    let searchController = new SearchController();
                    searchController.loadSearch();
                    break;
                case 'historical':
                    let historicalController = new HistoricalController();
                    historicalController.loadHistorical();
                    break;
                case 'gestion':
                    let gestionController = new GestionController();
                    gestionController.loadGestion();
                    break;
                
            }
        } else {
            console.error(`Route ${route} not found`);
        }
    }

    logout() {
        sessionStorage.removeItem('role');
        window.location.reload();
    }
}
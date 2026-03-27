import DashboardController from './dashboardController.js';
import AbsentController from './absentController.js';
import ScanController from './scanController.js';
import ManualEncodingController from './manualEncodingController.js';
import JustifiedOutingsController from './justifiedOutingsController.js';
import SearchController from './searchController.js';
import HistoricalController from './historicalController.js';
import GestionController from './gestionController.js';
import SessionController from './sessionController.js';

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
                    const sessionController = new SessionController();
                    sessionController.logout();
                    break;
                case 'dashboard':
                    const dashboardController = new DashboardController();
                    dashboardController.loadDashboard();
                    break;
                case 'scan':
                    const scanController = new ScanController();
                    scanController.loadScan();
                    break;
                case 'manualEncoding':
                    const manualEncodingController = new ManualEncodingController();
                    manualEncodingController.loadManualEncoding();
                    break;
                case 'absent':
                    const absentController = new AbsentController();
                    absentController.loadAbsent();
                    break;
                case 'justifiedOutings':
                    const justifiedOutingsController = new JustifiedOutingsController();
                    justifiedOutingsController.loadJustifiedOutings();
                    break;
                case 'search':
                    const searchController = new SearchController();
                    searchController.loadSearch();
                    break;
                case 'historical':
                    const historicalController = new HistoricalController();
                    historicalController.loadHistorical();
                    break;
                case 'gestion':
                    const gestionController = new GestionController();
                    gestionController.loadGestion();
                    break;
                
            }
        } else {
            console.error(`Route ${route} not found`);
        }
    }
}
import DashboardController from './dashboardController.js';
import AbsenceController from './absenceController.js';
import ScanController from './scanController.js';
import ManualEncodingController from './manualEncodingController.js';
import SearchController from './searchController.js';
import HistoricalController from './historicalController.js';
import ManagementController from './managementController.js';
import SessionController from './sessionController.js';

export default class RouteController {

    constructor() {
        this.routes = {
            'dashboard': this.loadDashboard,
            'scan': this.loadScan,
            'manualEncoding': this.loadManualEncoding,
            'absent': this.loadAbsent,
            'search': this.loadSearch,
            'historical': this.loadHistorical,
            'gestion': this.loadGestion,
            'logout': this.logout
        };
    }

    async navigate(route) {
        if(this.routes.hasOwnProperty(route)) {
            switch(route) {
                case 'logout':
                    const sessionController = new SessionController();
                    await sessionController.logout();
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
                    const absentController = new AbsenceController();
                    absentController.loadAbsent();
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
                    const gestionController = new ManagementController();
                    gestionController.loadGestion();
                    break;
                
            }
        } else {
            console.error(`Route ${route} not found`);
        }
    }
}
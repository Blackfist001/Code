import DashboardController from './dashboardController.js';
import AbsenceController from './absenceController.js';
import ScanController from './scanController.js';
import ManualEncodingController from './manualEncodingController.js';
import SearchController from './searchController.js';
import HistoricalController from './historicalController.js';
import ManagementController from './managementController.js';
import SessionController from './sessionController.js';

/**
 * Contrôleur de routage SPA.
 * Résout un nom de route en contrôleur et vérifie les droits d'accès selon le rôle.
 */
export default class RouteController {

    constructor() {
        this.routes = {
            'dashboard': this.loadDashboard,
            'scan': this.loadScan,
            'manualEncoding': this.loadManualEncoding,
            'absent': this.loadAbsent,
            'search': this.loadSearch,
            'historical': this.loadHistorical,
            'management': this.loadManagement,
            'gestion': this.loadGestion,
            'logout': this.logout
        };
    }

    /**
     * Navigue vers une route donnée. Les accès interdits selon le rôle sont bloqués.
     * Accepte un hash de section optionnel (ex : 'management#users').
     * @param {string} route - Nom de la route (ex : 'dashboard', 'scan', 'management#users')
     * @returns {Promise<void>}
     */
    async navigate(route) {
        // Extraire le hash de section (éventuellement : "management#users" → route="management", section="users")
        let section = 'passages';
        const hashIdx = route.indexOf('#');
        if (hashIdx !== -1) {
            section = route.slice(hashIdx + 1);
            route   = route.slice(0, hashIdx);
        }

        const role = sessionStorage.getItem('role');
        if (role === 'Surveillant') {
            const allowedRoutes = ['scan', 'manualEncoding', 'logout'];
            if (!allowedRoutes.includes(route)) {
                alert('Accès refusé à cette page.');
                route = 'scan';
            }
        }

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
                case 'management':
                case 'gestion':
                    if (sessionStorage.getItem('role') !== 'Administrateur') {
                        alert('Accès refusé à la gestion.');
                        this.navigate('dashboard');
                        break;
                    }
                    const managementController = new ManagementController();
                    managementController.loadManagement(section);
                    break;
                
            }
        } else {
            console.error(`Route ${route} not found`);
        }
    }
}
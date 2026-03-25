import sessionController from "./controller/sessionController.js";
import routeController from "./controller/routeController.js";
import scanController from './controller/scanController.js';

const session = new sessionController();
const route = new routeController();
const scanApp = new scanController();

// Rendre le routeController disponible globalement
window.routeController = route;

window.onload = function() {
    session.sessionCheck();
};

document.addEventListener('DOMContentLoaded', () => {
    // Délégation d'événements pour la navigation
    document.addEventListener('click', function(event) {
        // Vérifier si c'est un lien de navigation
        if (event.target.tagName === 'A' && event.target.classList.contains('nav-link')) {
            event.preventDefault();
            let hrefValue = event.target.getAttribute('href');
            
            if (hrefValue === '/logout') {
                session.logout();
            } else {
                const route = hrefValue.replace('/', '');
                window.routeController.navigate(route);
            }
        }
    });

    // Exemple : clic sur un bouton de scan
    const scanButton = document.getElementById('btn-submit-scan');
    if (scanButton) {
        scanButton.addEventListener('click', () => {
            const input = document.getElementById('input-id');
            if (input) {
                scanApp.processScan(input.value);
                input.value = '';
            }
        });
    }
});


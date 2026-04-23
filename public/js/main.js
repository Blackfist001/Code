/**
 * Point d'entrée principal de la SPA sortie-école.
 *
 * - Instancie les contrôleurs de session, de routage et de scan.
 * - Expose `routeController` globalement pour les liens de navigation.
 * - Vérifie la session active au chargement et gère la navigation SPA
 *   via délégation d'événements sur les éléments `<a>`.
 */
import sessionController from "./controller/sessionController.js";
import routeController from "./controller/routeController.js";
import scanController from './controller/scanController.js';
import './utils/sweetalert-setup.js';

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
        if (event.target.tagName === 'A') {
            event.preventDefault();
            let hrefValue = event.target.getAttribute('href');

            if (!hrefValue) {
                return;
            }

            // Normaliser pour logout (avec ou sans slash)
            if (hrefValue === 'logout' || hrefValue === '/logout') {
                session.logout();
                return;
            }

            // Si chemin absolu, retirer slash
            let route = hrefValue.startsWith('/') ? hrefValue.slice(1) : hrefValue;
            window.routeController.navigate(route);
        }
    });

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


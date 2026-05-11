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
        // Vérifier si c'est un lien de navigation (ou un élément dans un lien)
        const link = event.target.closest('a');
        if (!link) {
            return;
        }

        const hrefValue = link.getAttribute('href');
        if (!hrefValue) {
            return;
        }

        // Ne pas intercepter les téléchargements/fichiers/blob/urls externes
        if (
            link.hasAttribute('download') ||
            hrefValue.startsWith('blob:') ||
            hrefValue.startsWith('data:') ||
            hrefValue.startsWith('mailto:') ||
            hrefValue.startsWith('tel:') ||
            hrefValue.startsWith('http://') ||
            hrefValue.startsWith('https://')
        ) {
            return;
        }

        // Laisser le navigateur gérer les liens ouvrant un nouvel onglet
        if (link.target === '_blank') {
            return;
        }

        event.preventDefault();

        // Normaliser pour logout (avec ou sans slash)
        if (hrefValue === 'logout' || hrefValue === '/logout') {
            session.logout();
            return;
        }

        // Si chemin absolu, retirer slash
        const route = hrefValue.startsWith('/') ? hrefValue.slice(1) : hrefValue;
        window.routeController.navigate(route);
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


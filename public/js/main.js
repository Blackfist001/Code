import sessionController from "./controller/sessionController.js";
import routeController from "./controller/routeController.js";
import scanController from './controller/scanController.js';

const session = new sessionController();
const route = new routeController();
const scanApp = new scanController();

window.onload = function() {
    session.sessionCheck();
};

document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); // Empêche la navigation
        let hrefValue = this.getAttribute('href'); // Récupère la valeur exacte dans le HTML
        console.log(hrefValue);
        route.navigate(hrefValue);
    });
});


// Exemple : clic sur un bouton de scan
document.getElementById('btn-submit-scan').addEventListener('click', () => {
    const input = document.getElementById('input-id');
    scanApp.processScan(input.value);
    input.value = '';
});

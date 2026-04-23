/**
 * Vue de session.
 * Gère le rendu de la page de connexion et des barres de navigation selon le rôle.
 */
export default class SessionView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
        this.nav = document.getElementById('nav');
    }

    /**
     * Affiche la page de connexion dans le conteneur principal.
     */
    renderLogin() {
            this.nav.innerHTML = '';
            fetch('html/login.html')
                .then(response => response.text())
                .then(data => {
                    this.container.innerHTML = data;
                    this.attachLoginHandler();
                })
                .catch(error => console.error('Error loading login:', error));
    }

    /**
     * Attache l'écouteur sur le formulaire de connexion et délègue au contrôleur.
     */
    attachLoginHandler() {
        const form = document.querySelector('form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                if(username && password) {
                    this.controller.login(username, password);
                }
            });
        }
    }

    /**
     * Charge et affiche la navigation pour le rôle Surveillant.
     * @returns {Promise<void>}
     */
    renderUser() {
        return fetch('html/navUser.html')
            .then(response => response.text())
            .then(data => {
                this.nav.innerHTML = data;
            });
    }

    /**
     * Charge et affiche la navigation pour le rôle Administrateur.
     * @returns {Promise<void>}
     */
    renderAdmin() {
        return fetch('html/navAdmin.html')
            .then(response => response.text())
            .then(data => {
                this.nav.innerHTML = data;
            });
    }

    /**
     * Charge et affiche la navigation pour le rôle Gestionnaire.
     * @returns {Promise<void>}
     */
    renderGestion() {
        return fetch('html/navGestion.html')
            .then(response => response.text())
            .then(data => {
                this.nav.innerHTML = data;
            });
    }
}
import SessionView from "../view/sessionView.js";
import api from "../api.js";

export default class SessionController {

    constructor() {
        this.sessionRole = sessionStorage.getItem('role');
        this.sessionView = new SessionView(this);
        this.sessionCheck();
    }

    async login(username, password) {
        try {
            const response = await api.login(username, password);
            
            if (response.success) {
                // Stocker les informations de session
                const user = response.user;
                sessionStorage.setItem('user_id', user.id_user);
                sessionStorage.setItem('username', user.nom);
                sessionStorage.setItem('role', user.role);
                
                this.sessionRole = user.role;

                // Mettre à jour l'URL sans recharger (SPA)
                history.replaceState(null, '', '/');

                await this.sessionCheck();
            } else {
                alert('Erreur: ' + response.message);
            }
        } catch (error) {
            alert('Erreur de connexion: ' + error.message);
        }
    }

    async logout() {
        try {
            const response = await api.logout();
            if (!response || !response.success) {
                console.error('Erreur lors de la déconnexion API:', response);
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
        
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('user_id');
        sessionStorage.removeItem('username');
        this.sessionRole = null;
        await this.sessionCheck();
    }

    async sessionCheck() {
        if (this.sessionRole === null) {
            this.sessionView.renderLogin();
            return;
        }

        let defaultRoute = 'dashboard';

        if (this.sessionRole === 'administrateur') {
            await this.sessionView.renderAdmin();
        } else if (this.sessionRole === 'administration') {
            await this.sessionView.renderGestion();
        } else if (this.sessionRole === 'surveillant') {
            await this.sessionView.renderUser();
            defaultRoute = 'scan';
        }

        // Naviguer vers la page par défaut une fois la nav injectée
        if (window.routeController) {
            window.routeController.navigate(defaultRoute);
        }
    }
}
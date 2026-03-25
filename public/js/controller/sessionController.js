import SessionView from "../view/sessionView.js";

export default class SessionController {

    constructor() {
        this.sessionRole = sessionStorage.getItem('role');
        this.sessionView = new SessionView(this);
        this.sessionCheck();
    }

    login(username, password) {
        // TODO: Implémenter la validation avec le backend PHP
        // Pour l'instant, simulation simple
        if(username && password) {
            // Déterminer le rôle basé sur le username (à remplacer par un vrai appel API)
            let role = 'user';
            if(username.includes('admin')) {
                role = 'administrateur';
            } else if(username.includes('gestion')) {
                role = 'administration';
            }
            
            sessionStorage.setItem('role', role);
            this.sessionRole = role;
            this.sessionCheck();
        }
    }

    logout() {
        sessionStorage.removeItem('role');
        this.sessionRole = null;
        this.sessionCheck();
    }

    sessionCheck() {
        if(this.sessionRole === null) {
            this.sessionView.renderLogin();
        } else {
            if(this.sessionRole === 'administrateur') {
                this.sessionView.renderAdmin();
            } else if(this.sessionRole === 'administration') {
                this.sessionView.renderGestion();
            } else if(this.sessionRole === 'user') {
                this.sessionView.renderUser();
            }
        }
    }
}
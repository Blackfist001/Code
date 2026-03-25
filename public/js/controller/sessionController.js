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
                this.sessionCheck();
            } else {
                alert('Erreur: ' + response.message);
            }
        } catch (error) {
            alert('Erreur de connexion: ' + error.message);
        }
    }

    logout() {
        try {
            api.logout();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
        
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('user_id');
        sessionStorage.removeItem('username');
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
            } else if(this.sessionRole === 'surveillant') {
                this.sessionView.renderUser();
            }
        }
    }
}
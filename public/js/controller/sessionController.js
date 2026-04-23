import SessionView from "../view/sessionView.js";
import api from "../api.js";

/**
 * Contrôleur de session.
 * Gère l'authentification, la déconnexion et l'état de la session (rôle utilisateur).
 */
export default class SessionController {

    constructor() {
        this.sessionRole = sessionStorage.getItem('role');
        this.sessionView = new SessionView(this);
        this.sessionCheck();
    }

    /**
     * Authentifie l'utilisateur et initialise la session si les identifiants sont valides.
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe en clair
     * @returns {Promise<void>}
     */
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

                this._showOneRosterSyncSummary(response.oneroster_sync);

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

    /**
     * Affiche un résumé de la synchronisation OneRoster (SweetAlert ou alert natif).
     * @param {Object|null} syncInfo - Résultat de synchronisation retourné par l'API login
     */
    _showOneRosterSyncSummary(syncInfo) {
        if (!syncInfo || !syncInfo.executed) {
            return;
        }

        const stats = syncInfo.stats || {};

        if (syncInfo.success) {
            const text = [
                'Synchronisation OneRoster terminee.',
                `Total traites: ${stats.total ?? 0}`,
                `Inserts: ${stats.inserted ?? 0}`,
                `Mises a jour: ${stats.updated ?? 0}`,
                `Inchanges: ${stats.unchanged ?? 0}`,
                `Ignores: ${stats.skipped ?? 0}`,
                `Erreurs: ${stats.errors ?? 0}`,
            ].join('\n');

            if (window.Swal && typeof window.Swal.fire === 'function') {
                window.Swal.fire({
                    icon: 'success',
                    title: 'Synchronisation etudiants',
                    text,
                    confirmButtonText: 'OK',
                });
                return;
            }

            alert(text);
            return;
        }

        const errorText = `Synchronisation OneRoster echouee: ${syncInfo.message || 'erreur inconnue'}`;

        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                icon: 'warning',
                title: 'Synchronisation etudiants',
                text: errorText,
                confirmButtonText: 'OK',
            });
            return;
        }

        alert(errorText);
    }

    /**
     * Déconnecte l'utilisateur, vide la session et redirige vers la page de connexion.
     * @returns {Promise<void>}
     */
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

    /**
     * Vérifie l'état de la session et affiche la nav et la page adaptées au rôle.
     * Redirige vers la connexion si aucun rôle n'est détecté.
     * @returns {Promise<void>}
     */
    async sessionCheck() {
        if (this.sessionRole === null) {
            this.sessionView.renderLogin();
            return;
        }

        let defaultRoute = 'dashboard';

        if (this.sessionRole === 'Administrateur') {
            await this.sessionView.renderAdmin();
        } else if (this.sessionRole === 'Gestionnaire') {
            await this.sessionView.renderGestion();
        } else if (this.sessionRole === 'Surveillant') {
            await this.sessionView.renderUser();
            defaultRoute = 'scan';
        }

        // Naviguer vers la page par défaut une fois la nav injectée
        if (window.routeController) {
            window.routeController.navigate(defaultRoute);
        }
    }
}
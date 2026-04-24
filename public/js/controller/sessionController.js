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

                this._showSyncSummary(response.smartschool_sync || response.oneroster_sync);

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
     * Affiche un résumé de la synchronisation de données (SweetAlert ou alert natif).
     * @param {Object|null} syncInfo - Résultat de synchronisation retourné par l'API login
     */
    _showSyncSummary(syncInfo) {
        if (!syncInfo || !syncInfo.executed) {
            return;
        }

        const stats = syncInfo.stats || {};
        const hasSections = ['students', 'teachers', 'schedules'].some((key) => stats[key]);

        const formatSection = (label, sectionStats = {}) => {
            const e = sectionStats.errors ?? 0;
            const errStyle = e > 0 ? ' style="color:#e74c3c;font-weight:bold"' : '';
            return `<div style="margin:6px 0">
  <b>${label}</b>
  <span style="margin-left:8px;color:#555;font-size:.9em">
    ${sectionStats.total ?? 0} traités &nbsp;·&nbsp;
    <span style="color:#27ae60">${sectionStats.inserted ?? 0} inserts</span> &nbsp;·&nbsp;
    ${sectionStats.updated ?? 0} MAJ &nbsp;·&nbsp;
    ${sectionStats.unchanged ?? 0} inchangés
    ${e > 0 ? `&nbsp;·&nbsp;<span${errStyle}>${e} erreurs</span>` : ''}
  </span>
</div>`;
        };

        if (syncInfo.success) {
            const html = hasSections
                ? `<div style="text-align:left;font-size:.95em">
${formatSection('Étudiants', stats.students)}
${formatSection('Professeurs', stats.teachers)}
${formatSection('Cours', stats.schedules)}
</div>`
                : `<div style="text-align:left;font-size:.95em">
${formatSection('Total', stats)}
</div>`;

            if (window.Swal && typeof window.Swal.fire === 'function') {
                window.Swal.fire({
                    icon: 'success',
                    title: 'Synchronisation Smartschool',
                    html,
                    confirmButtonText: 'OK',
                });
                return;
            }

            alert(syncInfo.message || 'Synchronisation terminee.');
            return;
        }

        const errorMsg = syncInfo.message || 'erreur inconnue';
        const errorHtml = `<div style="text-align:left;font-size:.95em;color:#e74c3c">${errorMsg}</div>`;

        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                icon: 'warning',
                title: 'Synchronisation Smartschool',
                html: errorHtml,
                confirmButtonText: 'OK',
            });
            return;
        }

        alert('Synchronisation Smartschool: ' + errorMsg);
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
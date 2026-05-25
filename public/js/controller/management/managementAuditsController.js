/**
 * Sous-controleur de gestion des audits.
 */
export default class ManagementAuditsController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    async loadAudits() {
        try {
            const [loginsRes, dbRes] = await Promise.all([
                this.api.getAuditLogins(),
                this.api.getAuditDbChanges(),
            ]);

            const logins = loginsRes?.success ? (loginsRes.results || []) : [];
            const dbChanges = dbRes?.success ? (dbRes.results || []) : [];
            this.parent.view.displayAudits(logins, dbChanges);
        } catch (_) {
            this.parent.view.displayAudits([], []);
        }
    }
}

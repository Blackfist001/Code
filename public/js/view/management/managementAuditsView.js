/**
 * Sous-vue de gestion des audits.
 */
export default class ManagementAuditsView {
    constructor(parent) {
        this.parent = parent;
    }

    bindEvents(controller) {
        const reloadBtn = document.getElementById('btn-audits-reload');
        if (reloadBtn && controller?.loadAudits) {
            reloadBtn.addEventListener('click', () => controller.loadAudits());
        }
    }

    _toJson(value) {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'string') return value;
        try {
            return JSON.stringify(value, null, 2);
        } catch (_) {
            return String(value);
        }
    }

    displayAudits(logins = [], dbChanges = []) {
        const loginBody = document.getElementById('audits-logins-body');
        const dbBody = document.getElementById('audits-db-body');
        if (!loginBody || !dbBody) return;

        loginBody.innerHTML = '';
        dbBody.innerHTML = '';

        if (!Array.isArray(logins) || logins.length === 0) {
            loginBody.innerHTML = '<tr><td colspan="4">Aucune connexion auditée</td></tr>';
        } else {
            logins.forEach((row) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row?.user || '-'}</td>
                    <td>${row?.date || '-'}</td>
                    <td>${row?.time || '-'}</td>
                    <td>${row?.ip || '-'}</td>
                `;
                loginBody.appendChild(tr);
            });
        }

        if (!Array.isArray(dbChanges) || dbChanges.length === 0) {
            dbBody.innerHTML = '<tr><td colspan="8">Aucune modification DB auditée</td></tr>';
        } else {
            dbChanges.forEach((row) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row?.user || '-'}</td>
                    <td>${row?.date || '-'}</td>
                    <td>${row?.time || '-'}</td>
                    <td>${row?.ip || '-'}</td>
                    <td>${row?.action || '-'}</td>
                    <td>${row?.entity || '-'}</td>
                    <td><pre style="margin:0;white-space:pre-wrap;max-width:280px;">${this._toJson(row?.old_data)}</pre></td>
                    <td><pre style="margin:0;white-space:pre-wrap;max-width:280px;">${this._toJson(row?.new_data)}</pre></td>
                `;
                dbBody.appendChild(tr);
            });
        }
    }
}

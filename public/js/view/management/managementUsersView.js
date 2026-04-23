import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de gestion des utilisateurs.
 * Affiche le tableau des utilisateurs et les modales d'ajout/édition.
 */
export default class ManagementUsersView {
    constructor(parent) {
        this.parent = parent;
    }

    /**
     * Branche les écouteurs du formulaire d'ajout d'utilisateur.
     * @param {ManagementUsersController} controller
     */
    bindEvents(controller) {
        const addUserBtn = document.getElementById('btn-add-user');
        if (!addUserBtn || !controller) return;

        addUserBtn.addEventListener('click', () => {
            const username = document.getElementById('user-username')?.value || '';
            const password = document.getElementById('user-password')?.value || '';
            const role = document.getElementById('user-role')?.value || '';
            if (username && password && role) {
                controller.addUser({ username, password, role });
                document.getElementById('user-username').value = '';
                document.getElementById('user-password').value = '';
                document.getElementById('user-role').value = '';
            }
        });
    }

    /**
     * Peuple le tableau des utilisateurs avec les lignes édit/suppr.
     * @param {ManagementUsersController} controller
     * @param {Array} [users=[]] - Liste des utilisateurs
     */
    displayUsers(controller, users = []) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Aucun utilisateur</td></tr>';
            return;
        }

        users.forEach(user => {
            const id = user.id || user.id_user || '';
            const username = user.username || user.nom || '';
            const role = user.role || '';
            const isAdmin = username.toLowerCase() === 'admin';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${id}</td>
                <td>${username}</td>
                <td>${role}</td>
                <td>
                    <button class="btn-edit-user" data-id="${id}" data-username="${username}" data-role="${role}">Modifier</button>
                    ${isAdmin
                        ? '<button disabled title="L\'utilisateur admin ne peut pas être supprimé" style="opacity:0.4;cursor:not-allowed;">Supprimer</button>'
                        : `<button class="btn-delete-user" data-id="${id}">Supprimer</button>`
                    }
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', () => this.showEditUserModal(controller, btn.dataset.id, btn.dataset.username, btn.dataset.role));
        });

        tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer cet utilisateur ?')) controller.deleteUser(btn.dataset.id);
            });
        });
    }

    /**
     * Ouvre la modale d'édition préremplie pour un utilisateur.
     * @param {ManagementUsersController} controller
     * @param {number|string} userId
     * @param {string} currentUsername
     * @param {string} currentRole
     */
    showEditUserModal(controller, userId, currentUsername, currentRole) {
        this.parent._showModal(`
            <h3>Modifier l'utilisateur</h3>
            <div class="form-container">
                <input type="text" id="edit-user-username" value="${currentUsername}" placeholder="Nom d'utilisateur">
                <input type="password" id="edit-user-password" placeholder="Nouveau mot de passe (laisser vide)">
                <select id="edit-user-role">
                    <option value="Surveillant" ${currentRole === 'Surveillant' ? 'selected' : ''}>Surveillant</option>
                    <option value="Gestionnaire" ${currentRole === 'Gestionnaire' ? 'selected' : ''}>Gestionnaire</option>
                    <option value="Administrateur" ${currentRole === 'Administrateur' ? 'selected' : ''}>Administrateur</option>
                </select>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            const username = document.getElementById('edit-user-username').value;
            const password = document.getElementById('edit-user-password').value;
            const role = document.getElementById('edit-user-role').value;
            if (username && role) {
                controller.updateUser(userId, { username, password, role });
                this.parent._hideModal();
            }
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

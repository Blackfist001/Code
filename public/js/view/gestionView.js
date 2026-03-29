export default class GestionView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/gestion.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachEventListeners();
            })
            .catch(error => console.error('Error loading gestion:', error));
    }

    attachEventListeners() {
        // Add User Handler
        const addUserBtn = document.getElementById('btn-add-user');
        if (addUserBtn && this.controller) {
            addUserBtn.addEventListener('click', () => {
                const username = document.getElementById('user-username').value;
                const password = document.getElementById('user-password').value;
                const role = document.getElementById('user-role').value;
                
                if (username && password && role) {
                    const userData = {
                        username: username,
                        password: password,
                        role: role
                    };
                    this.controller.addUser(userData);
                    document.getElementById('user-username').value = '';
                    document.getElementById('user-password').value = '';
                    document.getElementById('user-role').value = '';
                }
            });
        }
    }

    displayUsers(users = []) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Aucun utilisateur</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const id = user.id || user.id_user || '';
            const username = user.username || user.nom || '';
            const role = user.role || '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${id || '---'}</td>
                <td>${username || '---'}</td>
                <td>${role || '---'}</td>
                <td>
                    <button class="btn-edit-user" data-user-id="${id}" data-username="${username}" data-role="${role}">
                        Modifier
                    </button>
                    <button class="btn-delete-user" data-user-id="${id}">
                        Supprimer
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Attach edit handlers for users
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const username = e.target.getAttribute('data-username');
                const role = e.target.getAttribute('data-role');
                this.showEditUserForm(userId, username, role);
            });
        });

        // Attach delete handlers for users
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-user-id');
                if (this.controller && confirm('Êtes-vous sûr?')) {
                    this.controller.deleteUser(userId);
                }
            });
        });
    }

    showEditUserForm(userId, currentUsername, currentRole) {
        // Créer un modal ou une section d'édition
        const editSection = document.createElement('div');
        editSection.id = 'edit-user-section';
        editSection.innerHTML = `
            <div class="card">
                <h3>Modifier l'utilisateur</h3>
                <div class="form-container">
                    <input type="text" id="edit-user-username" placeholder="Nom d'utilisateur" value="${currentUsername}" required>
                    <input type="password" id="edit-user-password" placeholder="Nouveau mot de passe (laisser vide pour garder l'ancien)">
                    <select id="edit-user-role" required>
                        <option value="">-- Rôle --</option>
                        <option value="surveillant" ${currentRole === 'surveillant' ? 'selected' : ''}>Surveillant</option>
                        <option value="administration" ${currentRole === 'administration' ? 'selected' : ''}>Administration</option>
                        <option value="administrateur" ${currentRole === 'administrateur' ? 'selected' : ''}>Administrateur</option>
                    </select>
                    <button id="btn-update-user" data-user-id="${userId}">Mettre à jour</button>
                    <button id="btn-cancel-edit">Annuler</button>
                </div>
            </div>
        `;

        // Insérer après la section d'ajout d'utilisateur
        const addUserCard = document.querySelector('.card');
        addUserCard.parentNode.insertBefore(editSection, addUserCard.nextSibling);

        // Attacher les événements
        document.getElementById('btn-update-user').addEventListener('click', () => {
            const username = document.getElementById('edit-user-username').value;
            const password = document.getElementById('edit-user-password').value;
            const role = document.getElementById('edit-user-role').value;
            
            if (username && role) {
                const userData = {
                    username: username,
                    password: password,
                    role: role
                };
                this.controller.updateUser(userId, userData);
                this.hideEditUserForm();
            }
        });

        document.getElementById('btn-cancel-edit').addEventListener('click', () => {
            this.hideEditUserForm();
        });
    }

    hideEditUserForm() {
        const editSection = document.getElementById('edit-user-section');
        if (editSection) {
            editSection.remove();
        }
    }
}
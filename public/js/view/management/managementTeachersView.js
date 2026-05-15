import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de la section professeurs.
 * Affiche le tableau des professeurs et la modale d'édition.
 */
export default class ManagementTeachersView {
    constructor(parent) {
        this.parent = parent;
    }

    /**
     * Branche les écouteurs du formulaire d'ajout de professeur.
     * @param {ManagementTeachersController} controller
     */
    bindEvents(controller) {
        const addTeacherBtn = document.getElementById('btn-add-teacher');
        if (!addTeacherBtn || !controller) return;

        addTeacherBtn.addEventListener('click', () => {
            const nom = document.getElementById('teacher-nom')?.value.trim() || '';
            const prenom = document.getElementById('teacher-prenom')?.value.trim() || '';
            const email = document.getElementById('teacher-email')?.value.trim() || '';
            const username = document.getElementById('teacher-username')?.value.trim() || '';

            controller.addTeacher({ nom, prenom, email, username });

            const fields = ['teacher-nom', 'teacher-prenom', 'teacher-email', 'teacher-username'];
            fields.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
        });
    }

    /**
     * Peuple le tableau des professeurs.
     * @param {ManagementTeachersController} _controller
     * @param {Array} [teachers=[]]
     */
    displayTeachers(controller, teachers = []) {
        const tbody = document.getElementById('teachers-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!teachers.length) {
            tbody.innerHTML = '<tr><td colspan="5">Aucun professeur</td></tr>';
            return;
        }

        teachers.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.nom || '---'}</td>
                <td>${t.prenom || '---'}</td>
                <td>${t.email || '---'}</td>
                <td>${t.username || '---'}</td>`;
            row.innerHTML += `
                <td>
                    <button class="btn-edit btn-edit-teacher" data-id="${t.id_professeur}" data-nom="${t.nom || ''}" data-prenom="${t.prenom || ''}" data-email="${t.email || ''}" data-username="${t.username || ''}">Modifier</button>
                    <button class="btn-delete btn-delete-teacher" data-id="${t.id_professeur}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-teacher').forEach(btn => {
            btn.addEventListener('click', () => this.showEditTeacherModal(
                controller,
                btn.dataset.id,
                btn.dataset.nom,
                btn.dataset.prenom,
                btn.dataset.email,
                btn.dataset.username
            ));
        });

        tbody.querySelectorAll('.btn-delete-teacher').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer ce professeur ?')) {
                    controller.deleteTeacher(btn.dataset.id);
                }
            });
        });
    }

    /**
     * Ouvre la modale d'édition préremplie pour un professeur.
     */
    showEditTeacherModal(controller, teacherId, currentNom, currentPrenom, currentEmail, currentUsername) {
        this.parent._showModal(`
            <h3>Modifier le professeur</h3>
            <div class="form-container">
                <input type="text" id="edit-teacher-nom" value="${currentNom || ''}" placeholder="Nom">
                <input type="text" id="edit-teacher-prenom" value="${currentPrenom || ''}" placeholder="Prénom">
                <input type="email" id="edit-teacher-email" value="${currentEmail || ''}" placeholder="Email">
                <input type="text" id="edit-teacher-username" value="${currentUsername || ''}" placeholder="Username">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', async () => {
            const saved = await controller.updateTeacher(teacherId, {
                nom: document.getElementById('edit-teacher-nom').value,
                prenom: document.getElementById('edit-teacher-prenom').value,
                email: document.getElementById('edit-teacher-email').value,
                username: document.getElementById('edit-teacher-username').value,
            });
            if (saved) {
                this.parent._hideModal();
            }
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

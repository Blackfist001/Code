import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de gestion des locaux.
 * Affiche le tableau des locaux et la modale d'edition.
 */
export default class ManagementClassroomView {
    constructor(parent) {
        this.parent = parent;
    }

    /**
     * Branche les ecouteurs du formulaire d'ajout de local.
     * @param {ManagementClassroomController} controller
     */
    bindEvents(controller) {
        const addClassroomBtn = document.getElementById('btn-add-classroom');
        if (!addClassroomBtn || !controller) return;

        addClassroomBtn.addEventListener('click', () => {
            const input = document.getElementById('classroom-name');
            const local = input ? input.value.trim() : '';
            controller.addClassroom({ local });
            if (input) input.value = '';
        });
    }

    /**
     * Peuple le tableau des locaux avec les lignes edit/suppr.
     * @param {ManagementClassroomController} controller
     * @param {Array} [classrooms=[]] - Liste des locaux
     */
    displayClassrooms(controller, classrooms = []) {
        const tbody = document.getElementById('classroom-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!classrooms.length) {
            tbody.innerHTML = '<tr><td colspan="2">Aucun local</td></tr>';
            return;
        }

        classrooms.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.local || '---'}</td>
                <td>
                    <button class="btn-edit btn-edit-classroom" data-id="${c.id_local}" data-local="${c.local || ''}">Modifier</button>
                    <button class="btn-delete btn-delete-classroom" data-id="${c.id_local}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-classroom').forEach(btn => {
            btn.addEventListener('click', () => this.showEditClassroomModal(controller, btn.dataset.id, btn.dataset.local));
        });

        tbody.querySelectorAll('.btn-delete-classroom').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer ce local ?')) controller.deleteClassroom(btn.dataset.id);
            });
        });
    }

    /**
     * Ouvre la modale d'edition preremplie pour un local.
     * @param {ManagementClassroomController} controller
     * @param {number|string} classroomId
     * @param {string} currentLocal - Nom actuel du local
     */
    showEditClassroomModal(controller, classroomId, currentLocal) {
        this.parent._showModal(`
            <h3>Modifier le local</h3>
            <div class="form-container modal-form-grid">
                <label for="edit-classroom-name">Local</label>
                <input type="text" id="edit-classroom-name" value="${currentLocal || ''}">
                <div class="modal-row-full modal-form-actions">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updateClassroom(classroomId, {
                local: document.getElementById('edit-classroom-name').value,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

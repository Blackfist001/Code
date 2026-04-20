import { confirmDialog } from '../../utils/dialog.js';

export default class ManagementClassesView {
    constructor(parent) {
        this.parent = parent;
    }

    bindEvents(controller) {
        const addClassBtn = document.getElementById('btn-add-class');
        if (!addClassBtn || !controller) return;

        addClassBtn.addEventListener('click', () => {
            const input = document.getElementById('class-name');
            const classe = input ? input.value.trim() : '';
            controller.addClass({ classe });
            if (input) input.value = '';
        });
    }

    displayClasses(controller, classes = []) {
        const tbody = document.getElementById('classes-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!classes.length) {
            tbody.innerHTML = '<tr><td colspan="2">Aucune classe</td></tr>';
            return;
        }

        classes.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.classe || '---'}</td>
                <td>
                    <button class="btn-edit-class" data-id="${c.id_classe}" data-classe="${c.classe || ''}">Modifier</button>
                    <button class="btn-delete-class" data-id="${c.id_classe}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-class').forEach(btn => {
            btn.addEventListener('click', () => this.showEditClassModal(controller, btn.dataset.id, btn.dataset.classe));
        });

        tbody.querySelectorAll('.btn-delete-class').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer cette classe ?')) controller.deleteClass(btn.dataset.id);
            });
        });
    }

    showEditClassModal(controller, classId, currentClasse) {
        this.parent._showModal(`
            <h3>Modifier la classe</h3>
            <div class="form-container">
                <input type="text" id="edit-class-name" value="${currentClasse || ''}" placeholder="Classe">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updateClass(classId, {
                classe: document.getElementById('edit-class-name').value,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

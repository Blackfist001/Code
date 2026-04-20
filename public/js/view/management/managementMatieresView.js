import { confirmDialog } from '../../utils/dialog.js';

export default class ManagementMatieresView {
    constructor(parent) {
        this.parent = parent;
    }

    bindEvents(controller) {
        const addMatiereBtn = document.getElementById('btn-add-matiere');
        if (!addMatiereBtn || !controller) return;

        addMatiereBtn.addEventListener('click', () => {
            const input = document.getElementById('matiere-name');
            const matiere = input ? input.value.trim() : '';
            controller.addMatiere({ matiere });
            if (input) input.value = '';
        });
    }

    displayMatieres(controller, matieres = []) {
        const tbody = document.getElementById('matieres-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!matieres.length) {
            tbody.innerHTML = '<tr><td colspan="2">Aucune matière</td></tr>';
            return;
        }

        matieres.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.matiere || '---'}</td>
                <td>
                    <button class="btn-edit-matiere" data-id="${m.id_matiere}" data-matiere="${m.matiere || ''}">Modifier</button>
                    <button class="btn-delete-matiere" data-id="${m.id_matiere}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-matiere').forEach(btn => {
            btn.addEventListener('click', () => this.showEditMatiereModal(controller, btn.dataset.id, btn.dataset.matiere));
        });

        tbody.querySelectorAll('.btn-delete-matiere').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer cette matière ?')) controller.deleteMatiere(btn.dataset.id);
            });
        });
    }

    showEditMatiereModal(controller, matiereId, currentMatiere) {
        this.parent._showModal(`
            <h3>Modifier la matière</h3>
            <div class="form-container">
                <input type="text" id="edit-matiere-name" value="${currentMatiere || ''}" placeholder="Matière">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updateMatiere(matiereId, {
                matiere: document.getElementById('edit-matiere-name').value,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

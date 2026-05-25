import { confirmDialog } from '../../utils/dialog.js';

export default class ManagementPassageTypesView {
    constructor(parent) {
        this.parent = parent;
    }

    notify(message, type = 'info') {
        if (message && window.AppNotifier && typeof window.AppNotifier.notify === 'function') {
            window.AppNotifier.notify(message, type);
            return;
        }
        alert(message);
    }

    bindEvents() {
        // Pas d'écouteurs persistants: ils sont branchés après chaque rendu de colonne.
    }

    _getKindTitle(kind) {
        return {
            types: 'Types de passage',
            statuses: 'Statuts de passage',
            reasons: 'Raisons de passage',
        }[kind] || kind;
    }

    _renderColumn(kind, rows = []) {
        const title = this._getKindTitle(kind);
        const emptyLabel = kind === 'types' ? 'Aucun type' : kind === 'statuses' ? 'Aucun statut' : 'Aucune raison';

        const isProtectedRow = (row) => {
            return (kind === 'types' || kind === 'statuses') && Number(row?.is_system || 0) === 1;
        };

        const tableRows = rows.length
            ? rows.map(row => `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span>${row.label || '---'}</span>
                            ${isProtectedRow(row) ? '<span style="padding:2px 8px;border-radius:999px;background:#ffedd5;color:#c2410c;font-size:12px;font-weight:600;">Protégé</span>' : ''}
                        </div>
                    </td>
                    <td>
                        <button type="button" class="btn-edit btn-edit-passage-meta" data-kind="${kind}" data-id="${row.id}" data-label="${row.label || ''}">Modifier</button>
                        ${isProtectedRow(row)
                            ? '<button type="button" class="btn-delete" disabled title="Valeur système protégée" style="background:#fecaca;color:#7f1d1d;border-color:#fca5a5;cursor:not-allowed;">Supprimer</button>'
                            : `<button type="button" class="btn-delete btn-delete-passage-meta" data-kind="${kind}" data-id="${row.id}">Supprimer</button>`}
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="2">${emptyLabel}</td></tr>`;

        return `
            <div class="card">
                <h4>${title}</h4>
                <div style="display:flex;gap:8px;align-items:center;margin:8px 0 12px 0;">
                    <input type="text" class="input-add-passage-meta" data-kind="${kind}" placeholder="Ajouter un libellé" style="flex:1;min-width:160px;">
                    <button type="button" class="btn-add btn-add-passage-meta" data-kind="${kind}">Ajouter</button>
                </div>
                <div class="passage-meta-feedback" data-kind="${kind}" style="min-height:18px;margin:-4px 0 10px 0;font-size:13px;"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Libellé</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    }

    displayPassageMetadata(controller, payload = {}) {
        const container = document.getElementById('passage-types-grid');
        if (!container) return;

        container.innerHTML = [
            this._renderColumn('types', payload.types || []),
            this._renderColumn('statuses', payload.statuses || []),
            this._renderColumn('reasons', payload.reasons || []),
        ].join('');

        const setInlineFeedback = (kind, message, type = 'info') => {
            const target = container.querySelector(`.passage-meta-feedback[data-kind="${kind}"]`);
            if (!target) return;
            const color = type === 'success' ? '#15803d' : type === 'error' ? '#b91c1c' : '#1f2937';
            target.textContent = message || '';
            target.style.color = color;
        };

        container.querySelectorAll('.btn-edit-passage-meta').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showEditModal(controller, btn.dataset.kind || '', btn.dataset.id || '', btn.dataset.label || '');
            });
        });

        container.querySelectorAll('.btn-add-passage-meta').forEach(btn => {
            btn.addEventListener('click', async () => {
                const kind = btn.dataset.kind || '';
                const input = container.querySelector(`.input-add-passage-meta[data-kind="${kind}"]`);
                const label = String(input?.value || '').trim();
                if (!label) {
                    setInlineFeedback(kind, 'Veuillez saisir un libellé.', 'error');
                    return;
                }
                const result = await controller.addPassageMetadata(kind, label);
                if (result?.success) {
                    setInlineFeedback(kind, 'Entrée ajoutée.', 'success');
                } else {
                    setInlineFeedback(kind, result?.message || 'Erreur lors de l\'ajout.', 'error');
                }
            });
        });

        container.querySelectorAll('.input-add-passage-meta').forEach(input => {
            input.addEventListener('keydown', async (event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                const kind = input.dataset.kind || '';
                const label = String(input.value || '').trim();
                if (!label) {
                    setInlineFeedback(kind, 'Veuillez saisir un libellé.', 'error');
                    return;
                }
                const result = await controller.addPassageMetadata(kind, label);
                if (result?.success) {
                    setInlineFeedback(kind, 'Entrée ajoutée.', 'success');
                } else {
                    setInlineFeedback(kind, result?.message || 'Erreur lors de l\'ajout.', 'error');
                }
            });
        });

        container.querySelectorAll('.btn-delete-passage-meta').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer cette valeur ?')) {
                    controller.deletePassageMetadata(btn.dataset.kind || '', btn.dataset.id || '');
                }
            });
        });
    }

    showEditModal(controller, kind, id, currentLabel) {
        this.parent._showModal(`
            <h3>Modifier le libellé</h3>
            <div class="form-container modal-form-grid">
                <label for="edit-passage-meta-label">Libellé</label>
                <input type="text" id="edit-passage-meta-label" value="${currentLabel || ''}" placeholder="Libellé">
                <div class="modal-row-full modal-form-actions">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updatePassageMetadata(kind, id, document.getElementById('edit-passage-meta-label').value);
            this.parent._hideModal();
        });
        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

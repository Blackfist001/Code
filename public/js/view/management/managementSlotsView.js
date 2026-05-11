import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de gestion des creneaux debut/fin.
 */
export default class ManagementSlotsView {
    constructor(parent) {
        this.parent = parent;
    }

    bindEvents(controller) {
        const addBtn = document.getElementById('btn-add-slot');
        if (!addBtn || !controller) return;

        addBtn.addEventListener('click', async () => {
            const timeEl = document.getElementById('slot-add-time');
            const typeEl = document.getElementById('slot-add-type');
            const creneau = timeEl?.value || '';
            const type = typeEl?.value || 'debut';

            if (!creneau) {
                alert('Veuillez saisir une heure.');
                return;
            }

            if (!(await this._confirm50MinutesRule(type, creneau))) return;

            await controller.addSlot({ type, creneau });
            if (timeEl) timeEl.value = '';
        });
    }

    _toMinutes(hhmm) {
        const [h, m] = String(hhmm || '00:00').split(':').map(v => parseInt(v, 10));
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
    }

    _toHHMM(value) {
        return String(value || '').substring(0, 5);
    }

    _findClosestSlot(referenceMinutes, slots) {
        if (!Array.isArray(slots) || slots.length === 0) return null;

        let closest = null;
        let bestDelta = Number.POSITIVE_INFINITY;

        slots.forEach(slot => {
            const minutes = this._toMinutes(this._toHHMM(slot.creneau));
            if (minutes === null) return;
            const delta = Math.abs(minutes - referenceMinutes);
            if (delta < bestDelta) {
                bestDelta = delta;
                closest = { slot, minutes, delta };
            }
        });

        return closest;
    }

    async _confirm50MinutesRule(type, creneau, currentId = null) {
        const targetMinutes = this._toMinutes(creneau);
        if (targetMinutes === null) return true;

        const oppositeSlots = type === 'debut' ? (this.parent._creneauxFin || []) : (this.parent._creneauxDebut || []);
        const expectedMinutes = type === 'debut' ? targetMinutes + 50 : targetMinutes - 50;

        const hasExactMatch = oppositeSlots.some(slot => {
            if (currentId && String(slot.id_creneau) === String(currentId)) return false;
            const slotMinutes = this._toMinutes(this._toHHMM(slot.creneau));
            return slotMinutes === expectedMinutes;
        });

        if (hasExactMatch) return true;

        const closest = this._findClosestSlot(targetMinutes, oppositeSlots);
        const typeLabel = type === 'debut' ? 'fin' : 'debut';
        const expectedHH = `${String(Math.floor(expectedMinutes / 60)).padStart(2, '0')}:${String(expectedMinutes % 60).padStart(2, '0')}`;

        let details = `Aucun créneau ${typeLabel} avec un écart de 50 minutes n'a été trouvé pour ${creneau} (attendu : ${expectedHH}).`;
        if (closest) {
            details += `\nLe plus proche est ${this._toHHMM(closest.slot.creneau)} (écart : ${closest.delta} min).`;
        }
        details += '\nVoulez-vous enregistrer quand même ?';

        return confirmDialog(details, {
            icon: 'warning',
            title: 'Vérification des créneaux',
            isDanger: false,
            confirmButtonText: 'Enregistrer quand même',
            cancelButtonText: 'Annuler'
        });
    }

    _renderRows(controller, type, rows) {
        const tbodyId = type === 'debut' ? 'slots-debut-body' : 'slots-fin-body';
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="2">Aucun créneau</td></tr>';
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${this._toHHMM(row.creneau)}</td>
                <td class="slot-actions-cell">
                    <button type="button" class="btn-edit btn-edit-slot slot-btn-secondary" data-slot-update="${row.id_creneau}" data-slot-type="${type}">Modifier</button>
                    <button type="button" class="btn-delete btn-delete-slot slot-btn-danger" data-slot-delete="${row.id_creneau}" data-slot-type="${type}">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('[data-slot-update]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-slot-update');
                const slotType = btn.getAttribute('data-slot-type');
                const row = rows.find(r => String(r.id_creneau) === id);
                if (row) {
                    this.showEditSlotModal(controller, id, slotType, this._toHHMM(row.creneau));
                }
            });
        });

        tbody.querySelectorAll('[data-slot-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-slot-delete');
                const slotType = btn.getAttribute('data-slot-type');
                if (await confirmDialog('Supprimer ce créneau ?')) {
                    await controller.deleteSlot(id, slotType);
                }
            });
        });
    }

    showEditSlotModal(controller, slotId, slotType, currentCreneau) {
        this.parent._showModal(`
            <h3>Modifier le créneau</h3>
            <p class="slots-help">Type : <strong>${slotType === 'debut' ? 'Créneau début' : 'Créneau fin'}</strong></p>
            <div class="form-container">
                <input type="time" id="edit-slot-time" value="${currentCreneau}" placeholder="Heure">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        const saveBtn = document.getElementById('modal-btn-save');
        const cancelBtn = document.getElementById('modal-btn-cancel');

        saveBtn.addEventListener('click', async () => {
            const creneau = document.getElementById('edit-slot-time').value;
            if (!creneau) {
                alert('Veuillez saisir une heure.');
                return;
            }

            if (!(await this._confirm50MinutesRule(slotType, creneau, slotId))) return;
            
            await controller.updateSlot(slotId, { type: slotType, creneau });
            this.parent._hideModal();
        });

        cancelBtn.addEventListener('click', () => this.parent._hideModal());
    }

    displaySlots(controller) {
        this._renderRows(controller, 'debut', this.parent._creneauxDebut || []);
        this._renderRows(controller, 'fin', this.parent._creneauxFin || []);
    }
}

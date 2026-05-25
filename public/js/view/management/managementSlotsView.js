import { confirmDialog } from '../../utils/dialog.js';
import '../../vendor/jspdf.umd.min.js';

/**
 * Sous-vue de gestion des creneaux debut/fin.
 */
export default class ManagementSlotsView {
    constructor(parent) {
        this.parent = parent;
    }

    _notify(message, type = 'info') {
        if (message && window.AppNotifier && typeof window.AppNotifier.notify === 'function') {
            window.AppNotifier.notify(message, type);
            return;
        }
        alert(message);
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
                this._notify('Veuillez saisir une heure.', 'warning');
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
            <div class="form-container modal-form-grid">
                <label for="edit-slot-time">Heure</label>
                <input type="time" id="edit-slot-time" value="${currentCreneau}" placeholder="Heure">
                <div class="modal-row-full modal-form-actions">
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
                this._notify('Veuillez saisir une heure.', 'warning');
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

    /**
     * Affiche une prévisualisation après recalcul automatique des créneaux.
     *
     * @param {Array<{oldStart:string, oldEnd:string, newStart:string, newEnd:string}>} rows
     * @param {number} duration
     */
    async showBulkUpdatePreview(rows = [], duration = 50) {
        const safeRows = Array.isArray(rows) ? rows : [];
        if (!safeRows.length) {
            return;
        }

        const tableHtml = `
            <div style="max-height:300px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;">
                <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Début (avant)</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Fin (avant)</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Début (après)</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Fin (après)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safeRows.map(r => `
                            <tr>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${r.oldStart}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${r.oldEnd}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#0f766e;font-weight:600;">${r.newStart}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#0f766e;font-weight:600;">${r.newEnd}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (window.Swal && typeof window.Swal.fire === 'function') {
            await window.Swal.fire({
                icon: 'success',
                title: 'Prévisualisation des créneaux appliqués',
                html: `
                    <p style="text-align:left;margin:0 0 .6rem 0;">Durée appliquée: <b>${duration} minutes</b></p>
                    ${tableHtml}
                    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
                        <button type="button" id="btn-preview-export-csv" class="swal2-styled" style="background:#2563eb;">Export CSV</button>
                        <button type="button" id="btn-preview-export-pdf" class="swal2-styled" style="background:#0f766e;">Export PDF</button>
                    </div>
                `,
                confirmButtonText: 'OK',
                didOpen: () => {
                    const csvBtn = document.getElementById('btn-preview-export-csv');
                    const pdfBtn = document.getElementById('btn-preview-export-pdf');

                    if (csvBtn) {
                        csvBtn.addEventListener('click', () => {
                            this._exportBulkUpdateCSV(safeRows, duration);
                        });
                    }

                    if (pdfBtn) {
                        pdfBtn.addEventListener('click', () => {
                            this._exportBulkUpdatePDF(safeRows, duration);
                        });
                    }
                },
            });
            return;
        }

        this._notify('Créneaux recalculés automatiquement. Vérifie la section Créneaux.', 'success');
    }

    _exportBulkUpdateCSV(rows = [], duration = 50) {
        const exportedBy = String(sessionStorage.getItem('username') || 'Utilisateur inconnu');
        const exportedAt = new Date();
        const exportedAtLabel = exportedAt.toLocaleString('fr-BE');
        const headers = ['Durée (min)', 'Début (avant)', 'Fin (avant)', 'Début (après)', 'Fin (après)'];
        const lines = ['sep=;'];
        lines.push(`"Exporté par";"${exportedBy.replace(/"/g, '""')}"`);
        lines.push(`"Exporté le";"${exportedAtLabel.replace(/"/g, '""')}"`);
        lines.push('');
        lines.push(headers.map(h => `"${h}"`).join(';'));

        (Array.isArray(rows) ? rows : []).forEach(row => {
            const record = [
                String(duration),
                row.oldStart || '---',
                row.oldEnd || '---',
                row.newStart || '---',
                row.newEnd || '---',
            ];
            lines.push(record.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'));
        });

        // Format compatible Excel (locale FR): UTF-16LE + BOM + séparateur ';' + CRLF.
        const csv = lines.join('\r\n');
        const utf16LeBytes = new Uint8Array(2 + csv.length * 2);
        utf16LeBytes[0] = 0xFF;
        utf16LeBytes[1] = 0xFE;
        for (let i = 0; i < csv.length; i += 1) {
            const code = csv.charCodeAt(i);
            utf16LeBytes[2 + i * 2] = code & 0xFF;
            utf16LeBytes[2 + i * 2 + 1] = code >> 8;
        }

        const blob = new Blob([utf16LeBytes], { type: 'text/csv;charset=utf-16le;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = exportedAt.toISOString().split('T')[0].replace(/-/g, '');
        a.href = url;
        a.download = `Preview_creneaux_${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    _exportBulkUpdatePDF(rows = [], duration = 50) {
        const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) {
            this._notify('Bibliothèque PDF non chargée.', 'error');
            return;
        }

        const exportedBy = String(sessionStorage.getItem('username') || 'Utilisateur inconnu');
        const exportedAt = new Date();
        const exportedAtLabel = exportedAt.toLocaleString('fr-BE');

        const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });
        const pageW = 297;
        const pageH = 210;
        const marginX = 12;
        const marginY = 12;
        const rowH = 7;
        const colW = [42, 42, 42, 42];
        const headers = ['Début (avant)', 'Fin (avant)', 'Début (après)', 'Fin (après)'];

        let y = marginY;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(31, 41, 55);
        doc.text('Prévisualisation des créneaux appliqués', marginX, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Durée appliquée : ${duration} minutes`, marginX, y);
        y += 5;
        doc.text(`Exporté par : ${exportedBy}    Exporté le : ${exportedAtLabel}`, marginX, y);
        y += 5;

        doc.setDrawColor(180, 180, 180);
        doc.line(marginX, y, pageW - marginX, y);
        y += 4;

        const drawHeader = () => {
            doc.setFillColor(44, 62, 80);
            doc.rect(marginX, y, colW.reduce((a, b) => a + b, 0), rowH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            let x = marginX;
            headers.forEach((h, i) => {
                doc.text(h, x + 2, y + rowH - 2);
                x += colW[i];
            });
            y += rowH;
        };

        drawHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);

        (Array.isArray(rows) ? rows : []).forEach((row, idx) => {
            if (y + rowH > pageH - marginY) {
                doc.addPage('a4', 'landscape');
                y = marginY;
                drawHeader();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
            }

            if (idx % 2 === 0) {
                doc.setFillColor(245, 247, 250);
                doc.rect(marginX, y, colW.reduce((a, b) => a + b, 0), rowH, 'F');
            }

            const cells = [row.oldStart || '---', row.oldEnd || '---', row.newStart || '---', row.newEnd || '---'];
            let x = marginX;
            cells.forEach((cell, i) => {
                if (i >= 2) {
                    doc.setTextColor(15, 118, 110);
                } else {
                    doc.setTextColor(31, 41, 55);
                }
                doc.text(String(cell), x + 2, y + rowH - 2);
                x += colW[i];
            });

            doc.setDrawColor(220, 220, 220);
            doc.line(marginX, y + rowH, marginX + colW.reduce((a, b) => a + b, 0), y + rowH);
            y += rowH;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p += 1) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${p} / ${totalPages}`, pageW - marginX - 20, pageH - 5);
            doc.text(`Exporté le ${new Date().toLocaleDateString('fr-BE')}`, marginX, pageH - 5);
        }

        const today = exportedAt.toISOString().split('T')[0].replace(/-/g, '');
        doc.save(`Preview_creneaux_${today}.pdf`);
    }
}

import '../../vendor/jspdf.umd.min.js';
import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de gestion des horaires de cours.
 * Affiche le tableau des horaires, les filtres classe/matière et la modale d'édition.
 */
export default class ManagementSchedulesView {
    constructor(parent) {
        this.parent = parent;
        this._allSchedules = [];
        this._currentPage = 1;
        this._pageSize = 20;
        this._weekDays = [
            { value: 'lundi', label: 'Lundi' },
            { value: 'mardi', label: 'Mardi' },
            { value: 'mercredi', label: 'Mercredi' },
            { value: 'jeudi', label: 'Jeudi' },
            { value: 'vendredi', label: 'Vendredi' },
        ];
    }

    _toHHMM(value) {
        return String(value || '').substring(0, 5);
    }

    /**
     * Branche les écouteurs du formulaire d'ajout d'horaire.
     * @param {ManagementSchedulesController} controller
     */
    bindEvents(controller) {
        const addSchedBtn = document.getElementById('btn-add-schedule');
        if (addSchedBtn && controller) {
            addSchedBtn.addEventListener('click', () => {
                const data = {
                    id_classe: document.getElementById('sched-classe').value,
                    id_matiere: document.getElementById('sched-matiere').value,
                    jour_semaine: document.getElementById('sched-jour').value,
                    id_creneau_debut: document.getElementById('sched-debut').value,
                    id_creneau_fin: document.getElementById('sched-fin').value,
                    id_local: document.getElementById('sched-local').value,
                    id_professeur: document.getElementById('sched-professeur').value,
                };
                if (!data.id_classe || !data.id_matiere || !data.jour_semaine || !data.id_creneau_debut || !data.id_creneau_fin) {
                    alert('Veuillez remplir tous les champs obligatoires.');
                    return;
                }
                controller.addSchedule(data);
                ['sched-classe', 'sched-matiere', 'sched-jour', 'sched-debut', 'sched-fin', 'sched-local', 'sched-professeur']
                    .forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
            });
        }

        ['sched-filter-classe', 'sched-filter-matiere', 'sched-filter-jour'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this._applyFilters(controller));
            }
        });

        const gridClassSelect = document.getElementById('sched-grid-classe');
        if (gridClassSelect) {
            gridClassSelect.addEventListener('change', () => this.renderClassGrid());
        }

        const saveClassGridBtn = document.getElementById('btn-save-class-schedule');
        if (saveClassGridBtn && controller) {
            saveClassGridBtn.addEventListener('click', async () => {
                const classId = (document.getElementById('sched-grid-classe')?.value || '').trim();
                if (!classId) {
                    alert('Veuillez sélectionner une classe.');
                    return;
                }

                const entries = this._collectGridEntries();
                const confirmed = await confirmDialog(
                    'Confirmer l\'enregistrement de toute la grille horaire de cette classe ?'
                );
                if (!confirmed) {
                    return;
                }

                controller.saveClassScheduleGrid({
                    id_classe: classId,
                    entries,
                });
            });
        }

        const exportCsvBtn = document.getElementById('btn-export-class-schedule-csv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this._exportClassGridCSV());
        }

        const exportPdfBtn = document.getElementById('btn-export-class-schedule-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this._exportClassGridPDF());
        }
    }

    /**
     * Resynchronise les options de classe dans les menus de la section horaires.
     */
    updateClassOptions() {
        const classeSelect = document.getElementById('sched-classe');
        if (classeSelect) {
            classeSelect.innerHTML = this.parent._renderClassOptions('', true);
        }

        const gridClassSelect = document.getElementById('sched-grid-classe');
        if (gridClassSelect) {
            const previousValue = gridClassSelect.value;
            gridClassSelect.innerHTML = this.parent._renderClassOptions('', true);
            gridClassSelect.value = previousValue;
        }

        const classeFilter = document.getElementById('sched-filter-classe');
        if (classeFilter) {
            const previousValue = classeFilter.value;
            classeFilter.innerHTML = this.parent._renderClassOptions('', true)
                .replace('-- Classe --', '-- Toutes les classes --');
            classeFilter.value = previousValue;
        }

        this.renderClassGrid();
    }

    /**
     * Resynchronise les options de matière dans les menus de la section horaires.
     */
    updateMatiereOptions() {
        const matiereSelect = document.getElementById('sched-matiere');
        if (matiereSelect) {
            matiereSelect.innerHTML = this.parent._renderMatiereOptions('', true);
        }

        const matiereFilter = document.getElementById('sched-filter-matiere');
        if (matiereFilter) {
            const previousValue = matiereFilter.value;
            matiereFilter.innerHTML = this.parent._renderMatiereOptions('', true)
                .replace('-- Matière --', '-- Toutes les matières --');
            matiereFilter.value = previousValue;
        }

        this.renderClassGrid();
    }

    /**
     * Resynchronise les créneaux disponibles dans les menus début/fin du formulaire.
     */
    updateSlotOptions() {
        const debutSelect = document.getElementById('sched-debut');
        const finSelect = document.getElementById('sched-fin');

        if (debutSelect) {
            debutSelect.innerHTML = this.parent._renderCreneauDebutOptions('', true);
        }
        if (finSelect) {
            finSelect.innerHTML = this.parent._renderCreneauFinOptions('', true);
        }

        this.renderClassGrid();
    }

    /**
     * Resynchronise les locaux disponibles dans les menus de la section horaires.
     */
    updateLocalOptions() {
        const localSelect = document.getElementById('sched-local');
        if (localSelect) {
            localSelect.innerHTML = this.parent._renderLocalOptions('', true);
        }
    }

    /**
     * Resynchronise les professeurs disponibles dans la grille hebdomadaire.
     */
    updateTeacherOptions() {
        const teacherSelect = document.getElementById('sched-professeur');
        if (teacherSelect) {
            teacherSelect.innerHTML = this.parent._renderTeacherOptions('', true);
        }
        this.renderClassGrid();
    }

    _renderMatiereSelectOptions(selectedId = '') {
        return this.parent._renderMatiereOptions(selectedId, true).replace('-- Matière --', '-- Aucun --');
    }

    _renderTeacherSelectOptions(selectedId = '') {
        return this.parent._renderTeacherOptions(selectedId, true).replace('-- Professeur --', '-- Aucun --');
    }

    _findScheduleForCell(classId, day, startSlotId) {
        return (this._allSchedules || []).find((s) => (
            String(s.id_classe || '') === String(classId)
            && String(s.jour_semaine || '').toLowerCase() === String(day || '').toLowerCase()
            && String(s.id_creneau_debut || '') === String(startSlotId)
        ));
    }

    _findEndSlotLabel(startSlotId) {
        const startSlots = Array.isArray(this.parent._creneauxDebut) ? this.parent._creneauxDebut : [];
        const endSlots = Array.isArray(this.parent._creneauxFin) ? this.parent._creneauxFin : [];
        const startRow = startSlots.find((s) => String(s.id_creneau) === String(startSlotId));
        const startValue = String(startRow?.creneau || '').trim();
        if (!startValue) {
            return '---';
        }

        const match = startValue.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
        if (!match) {
            return '---';
        }

        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        const totalMinutes = (hours * 60 + minutes + 50) % (24 * 60);
        const endHours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
        const endMins = String(totalMinutes % 60).padStart(2, '0');
        const endValue = `${endHours}:${endMins}:00`;

        const endRow = endSlots.find((s) => String(s.creneau || '').trim() === endValue);
        return endRow ? this._toHHMM(endRow.creneau) : '---';
    }

    _collectGridEntries() {
        const cells = Array.from(document.querySelectorAll('.schedule-grid-cell[data-day][data-start-slot]'));

        return cells.map((select) => {
            const day = String(select.dataset.day || '').toLowerCase();
            const startSlotId = String(select.dataset.startSlot || '');
            const matiereId = String(select.querySelector('select[data-field="matiere"]')?.value || '').trim();
            const localId = String(select.querySelector('select[data-field="local"]')?.value || '').trim();
            const teacherId = String(select.querySelector('select[data-field="teacher"]')?.value || '').trim();
            return {
                jour_semaine: day,
                id_creneau_debut: startSlotId,
                id_matiere: matiereId || null,
                id_local: localId || null,
                id_professeur: teacherId || null,
            };
        });
    }

    _getSelectedClassLabel() {
        const select = document.getElementById('sched-grid-classe');
        if (!select) {
            return '';
        }

        const selectedOption = select.options[select.selectedIndex];
        return (selectedOption?.text || '').trim();
    }

    _collectGridTableForExport() {
        const table = document.querySelector('#sched-grid-container .schedule-grid-table');
        if (!table) {
            return null;
        }

        const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
            const firstCell = tr.querySelector('td.schedule-grid-slot');
            const startLabel = (firstCell?.textContent || '').trim();

            const dayValues = Array.from(tr.querySelectorAll('td.schedule-grid-cell')).map((cell) => {
                const matiereText = (cell.querySelector('select[data-field="matiere"] option:checked')?.textContent || '').trim();
                const localText = (cell.querySelector('select[data-field="local"] option:checked')?.textContent || '').trim();
                const teacherText = (cell.querySelector('select[data-field="teacher"] option:checked')?.textContent || '').trim();

                const parts = [matiereText, localText, teacherText]
                    .filter((text) => text && !text.startsWith('--'));

                return parts.join(' | ');
            });

            const endCell = tr.querySelector('td.schedule-grid-slot:last-child');
            const endLabel = (endCell?.textContent || '').trim();

            return [startLabel, ...dayValues, endLabel];
        });

        return { headers, rows };
    }

    _exportClassGridCSV() {
        const classId = (document.getElementById('sched-grid-classe')?.value || '').trim();
        if (!classId) {
            alert('Veuillez sélectionner une classe.');
            return;
        }

        const grid = this._collectGridTableForExport();
        if (!grid || !grid.rows.length) {
            alert('Aucune grille à exporter.');
            return;
        }

        const classLabel = this._getSelectedClassLabel();
        const rows = [];
        rows.push('sep=;');
        rows.push(`"Classe";"${String(classLabel).replace(/"/g, '""')}"`);
        rows.push(grid.headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(';'));
        grid.rows.forEach((row) => {
            rows.push(row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'));
        });

        const csv = rows.join('\r\n');
        const utf16LeBytes = new Uint8Array(2 + csv.length * 2);
        utf16LeBytes[0] = 0xFF;
        utf16LeBytes[1] = 0xFE;
        for (let i = 0; i < csv.length; i++) {
            const code = csv.charCodeAt(i);
            utf16LeBytes[2 + i * 2] = code & 0xFF;
            utf16LeBytes[2 + i * 2 + 1] = code >> 8;
        }

        const blob = new Blob([utf16LeBytes], { type: 'text/csv;charset=utf-16le;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const safeClass = classLabel.replace(/[^a-zA-Z0-9_-]/g, '_') || classId;
        link.setAttribute('href', url);
        link.setAttribute('download', `Horaire_classe_${safeClass}_${today}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    _exportClassGridPDF() {
        const classId = (document.getElementById('sched-grid-classe')?.value || '').trim();
        if (!classId) {
            alert('Veuillez sélectionner une classe.');
            return;
        }

        const grid = this._collectGridTableForExport();
        if (!grid || !grid.rows.length) {
            alert('Aucune grille à exporter.');
            return;
        }

        const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) {
            alert('Bibliothèque PDF non chargée.');
            return;
        }

        const classLabel = this._getSelectedClassLabel();
        const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });
        const pageW = 297;
        const pageH = 210;
        const marginX = 12;
        const marginY = 12;
        const rowH = 7;
        const totalTableW = pageW - marginX * 2;
        const colCount = grid.headers.length;
        const colW = new Array(colCount).fill(totalTableW / colCount);

        let y = marginY;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.text('Horaire de classe', marginX, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Classe : ${classLabel}`, marginX, y);
        y += 5;

        doc.setDrawColor(180, 180, 180);
        doc.line(marginX, y, pageW - marginX, y);
        y += 4;

        const drawHeader = () => {
            doc.setFillColor(44, 62, 80);
            doc.rect(marginX, y, totalTableW, rowH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            let x = marginX;
            grid.headers.forEach((h, i) => {
                doc.text(String(h), x + 2, y + rowH - 2);
                x += colW[i];
            });
            y += rowH;
        };

        drawHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);

        grid.rows.forEach((row, idx) => {
            if (y + rowH > pageH - marginY) {
                doc.addPage('a4', 'landscape');
                y = marginY;
                drawHeader();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
            }

            if (idx % 2 === 0) {
                doc.setFillColor(245, 247, 250);
                doc.rect(marginX, y, totalTableW, rowH, 'F');
            }

            let x = marginX;
            row.forEach((cell, i) => {
                doc.setTextColor(31, 41, 55);
                const truncated = doc.splitTextToSize(String(cell || ''), colW[i] - 3)[0] || '';
                doc.text(truncated, x + 2, y + rowH - 2);
                x += colW[i];
            });

            doc.setDrawColor(220, 220, 220);
            doc.line(marginX, y + rowH, marginX + totalTableW, y + rowH);
            y += rowH;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${p} / ${totalPages}`, pageW - marginX - 20, pageH - 5);
            doc.text(`Exporté le ${new Date().toLocaleDateString('fr-BE')}`, marginX, pageH - 5);
        }

        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const safeClass = classLabel.replace(/[^a-zA-Z0-9_-]/g, '_') || classId;
        doc.save(`Horaire_classe_${safeClass}_${today}.pdf`);
    }

    renderClassGrid() {
        const container = document.getElementById('sched-grid-container');
        const classId = (document.getElementById('sched-grid-classe')?.value || '').trim();
        if (!container) {
            return;
        }

        if (!classId) {
            container.innerHTML = '<p class="slots-help">Sélectionnez une classe pour afficher la grille hebdomadaire.</p>';
            return;
        }

        const startSlots = Array.isArray(this.parent._creneauxDebut) ? this.parent._creneauxDebut : [];
        if (!startSlots.length) {
            container.innerHTML = '<p class="slots-help">Aucun créneau de début disponible.</p>';
            return;
        }

        const dayColumns = this._weekDays
            .map((d) => `<th>${d.label}</th>`)
            .join('');

        const rows = startSlots.map((slot) => {
            const slotId = String(slot.id_creneau || '');
            const cells = this._weekDays.map((d) => {
                const schedule = this._findScheduleForCell(classId, d.value, slotId);
                const selectedMatiereId = String(schedule?.id_matiere || '');
                const selectedLocalId = String(schedule?.id_local || '');
                const selectedTeacherId = String(schedule?.id_professeur || '');

                return `
                    <td class="schedule-grid-cell" data-day="${d.value}" data-start-slot="${slotId}">
                        <div style="display:flex;flex-direction:column;gap:6px;min-width:180px;">
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <span style="font-size:12px;font-weight:600;">Matières :</span>
                                <select data-field="matiere" data-day="${d.value}" data-start-slot="${slotId}">
                                    ${this._renderMatiereSelectOptions(selectedMatiereId)}
                                </select>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <span style="font-size:12px;font-weight:600;">Local :</span>
                                <select data-field="local" data-day="${d.value}" data-start-slot="${slotId}">
                                    ${this.parent._renderLocalOptions(selectedLocalId, true).replace('-- Local --', '-- Aucun --')}
                                </select>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <span style="font-size:12px;font-weight:600;">Professeur :</span>
                                <select data-field="teacher" data-day="${d.value}" data-start-slot="${slotId}">
                                    ${this._renderTeacherSelectOptions(selectedTeacherId)}
                                </select>
                            </div>
                        </div>
                    </td>
                `;
            }).join('');

            const endLabel = this._findEndSlotLabel(slotId);

            return `
                <tr>
                    <td class="schedule-grid-slot">${this._toHHMM(slot.creneau)}</td>
                    ${cells}
                    <td class="schedule-grid-slot">${endLabel}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table class="schedule-grid-table">
                <thead>
                    <tr>
                        <th>Horaire de début de cour</th>
                        ${dayColumns}
                        <th>Horaire de fin de cour</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    /**
     * Filtre les horaires stockés selon les valeurs des filtres DOM (classe, matière).
     * @returns {Array}
     */
    _getFilteredSchedules() {
        const classeFilter = (document.getElementById('sched-filter-classe')?.value || '').trim();
        const matiereFilter = (document.getElementById('sched-filter-matiere')?.value || '').trim();
        const jourFilter = (document.getElementById('sched-filter-jour')?.value || '').trim().toLowerCase();

        return (this._allSchedules || []).filter(s => {
            const classId = String(s.id_classe || '');
            const matiereId = String(s.id_matiere || '');
            const jour = String(s.jour_semaine || '').toLowerCase();

            if (classeFilter && classId !== classeFilter) return false;
            if (matiereFilter && matiereId !== matiereFilter) return false;
            if (jourFilter && jour !== jourFilter) return false;
            return true;
        });
    }

    /**
     * Rend la pagination sous le tableau des horaires.
     * @param {ManagementSchedulesController} controller
     * @param {number} totalItems
     */
    _renderPagination(controller, totalItems) {
        const tbody = document.getElementById('schedules-table-body');
        const table = tbody ? tbody.closest('table') : null;
        if (!table || !table.parentNode) return;

        let paginationEl = document.getElementById('schedules-pagination');
        if (!paginationEl) {
            paginationEl = document.createElement('div');
            paginationEl.id = 'schedules-pagination';
            paginationEl.className = 'list-pagination';
            table.parentNode.insertBefore(paginationEl, table.nextSibling);
        }

        const totalPages = Math.ceil(totalItems / this._pageSize);
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        const prevDisabled = this._currentPage <= 1 ? 'disabled' : '';
        const nextDisabled = this._currentPage >= totalPages ? 'disabled' : '';
        paginationEl.innerHTML = `
            <button type="button" id="sched-page-prev" ${prevDisabled}>Précédent</button>
            <span>Page ${this._currentPage} / ${totalPages}</span>
            <button type="button" id="sched-page-next" ${nextDisabled}>Suivant</button>
        `;

        const filtered = this._getFilteredSchedules();

        document.getElementById('sched-page-prev')?.addEventListener('click', () => {
            if (this._currentPage > 1) {
                this._currentPage--;
                this._renderRows(controller, filtered);
            }
        });

        document.getElementById('sched-page-next')?.addEventListener('click', () => {
            if (this._currentPage < totalPages) {
                this._currentPage++;
                this._renderRows(controller, filtered);
            }
        });
    }

    /**
     * Injecte les lignes du tableau pour la liste d'horaires donnée (avec pagination).
     * @param {ManagementSchedulesController} controller
     * @param {Array} [schedules=[]] - Horaires à afficher (liste filtrée complète)
     */
    _renderRows(controller, schedules = []) {
        const tbody = document.getElementById('schedules-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!schedules.length) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun horaire pour ce filtre</td></tr>';
            this._renderPagination(controller, 0);
            return;
        }

        const startIndex = (this._currentPage - 1) * this._pageSize;
        const pageItems = schedules.slice(startIndex, startIndex + this._pageSize);

        const jourLabels = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi' };

        pageItems.forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.classe || s.nom_classe || '---'}</td>
                <td>${s.matiere || '---'}</td>
                <td>${jourLabels[s.jour_semaine] ?? s.jour_semaine ?? '---'}</td>
                <td>${(s.heure_debut || '---').substring(0, 5)}</td>
                <td>${(s.heure_fin || '---').substring(0, 5)}</td>
                <td>${s.local || '---'}</td>
                <td>
                    <button class="btn-edit btn-edit-schedule" data-id="${s.id}">Modifier</button>
                    <button class="btn-delete btn-delete-schedule" data-id="${s.id}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-schedule').forEach(btn => {
            btn.addEventListener('click', () => {
                const schedule = (this._allSchedules || []).find(s => String(s.id) === btn.dataset.id);
                if (schedule) this.showEditScheduleModal(controller, schedule);
            });
        });

        tbody.querySelectorAll('.btn-delete-schedule').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer cet horaire ?')) controller.deleteSchedule(btn.dataset.id);
            });
        });

        this._renderPagination(controller, schedules.length);
    }

    /**
     * Re-filtre et re-rend les lignes après un changement de filtre.
     * Remet la pagination à la première page.
     * @param {ManagementSchedulesController} controller
     */
    _applyFilters(controller) {
        this._currentPage = 1;
        this._renderRows(controller, this._getFilteredSchedules());
    }

    /**
     * Stocke la liste complète des horaires et met à jour l'affichage.
     * @param {ManagementSchedulesController} controller
     * @param {Array} [schedules=[]] - Liste complète des horaires
     */
    displaySchedules(controller, schedules = []) {
        this._allSchedules = Array.isArray(schedules) ? schedules : [];
        this._applyFilters(controller);
        this.renderClassGrid();
    }

    /**
     * Ouvre la modale d'édition préremplie pour un horaire.
     * @param {ManagementSchedulesController} controller
     * @param {Object} s - Données de l'horaire sélectionné
     */
    showEditScheduleModal(controller, s) {
        const selectedClassId = s.id_classe || '';
        const selectedMatiereId = s.id_matiere || '';
        const selectedLocalId = s.id_local || '';
        const selectedTeacherId = s.id_professeur || '';
        this.parent._showModal(`
            <h3>Modifier l'horaire</h3>
            <div class="form-container">
                <div class="schedule-field-group">
                    <label for="edit-sched-classe">Classe :</label>
                    <select id="edit-sched-classe">${this.parent._renderClassOptions(selectedClassId, true)}</select>
                </div>
                <div class="schedule-field-group">
                    <label for="edit-sched-matiere">Matières :</label>
                    <select id="edit-sched-matiere">${this.parent._renderMatiereOptions(selectedMatiereId, true)}</select>
                </div>
                <div class="schedule-field-group">
                    <label for="edit-sched-jour">Jour :</label>
                    <select id="edit-sched-jour">
                    <option value="lundi" ${s.jour_semaine === 'lundi' ? 'selected' : ''}>Lundi</option>
                    <option value="mardi" ${s.jour_semaine === 'mardi' ? 'selected' : ''}>Mardi</option>
                    <option value="mercredi" ${s.jour_semaine === 'mercredi' ? 'selected' : ''}>Mercredi</option>
                    <option value="jeudi" ${s.jour_semaine === 'jeudi' ? 'selected' : ''}>Jeudi</option>
                    <option value="vendredi" ${s.jour_semaine === 'vendredi' ? 'selected' : ''}>Vendredi</option>
                    </select>
                </div>
                <div class="schedule-field-group">
                    <label for="edit-sched-debut">Début :</label>
                    <select id="edit-sched-debut">${this.parent._renderCreneauDebutOptions(s.id_creneau_debut || '')}</select>
                </div>
                <div class="schedule-field-group">
                    <label for="edit-sched-fin">Fin :</label>
                    <select id="edit-sched-fin">${this.parent._renderCreneauFinOptions(s.id_creneau_fin || '')}</select>
                </div>
                <div class="schedule-field-group">
                    <label for="edit-sched-local">Local :</label>
                    <select id="edit-sched-local">${this.parent._renderLocalOptions(selectedLocalId, true)}</select>
                </div>
                <div class="schedule-field-group">
                    <label for="edit-sched-professeur">Professeur :</label>
                    <select id="edit-sched-professeur">${this.parent._renderTeacherOptions(selectedTeacherId, true)}</select>
                </div>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updateSchedule(s.id, {
                id_classe: document.getElementById('edit-sched-classe').value,
                id_matiere: document.getElementById('edit-sched-matiere').value,
                jour_semaine: document.getElementById('edit-sched-jour').value,
                id_creneau_debut: document.getElementById('edit-sched-debut').value,
                id_creneau_fin: document.getElementById('edit-sched-fin').value,
                id_local: document.getElementById('edit-sched-local').value,
                id_professeur: document.getElementById('edit-sched-professeur').value,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

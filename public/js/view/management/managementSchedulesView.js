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
                    salle: document.getElementById('sched-salle').value.trim(),
                };
                if (!data.id_classe || !data.id_matiere || !data.jour_semaine || !data.id_creneau_debut || !data.id_creneau_fin) {
                    alert('Veuillez remplir tous les champs obligatoires.');
                    return;
                }
                controller.addSchedule(data);
                ['sched-classe', 'sched-matiere', 'sched-jour', 'sched-debut', 'sched-fin', 'sched-salle']
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
    }

    /**
     * Resynchronise les options de classe dans les menus de la section horaires.
     */
    updateClassOptions() {
        const classeSelect = document.getElementById('sched-classe');
        if (classeSelect) {
            classeSelect.innerHTML = this.parent._renderClassOptions('', true);
        }

        const classeFilter = document.getElementById('sched-filter-classe');
        if (classeFilter) {
            const previousValue = classeFilter.value;
            classeFilter.innerHTML = this.parent._renderClassOptions('', true)
                .replace('-- Classe --', '-- Toutes les classes --');
            classeFilter.value = previousValue;
        }
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
                <td>${s.salle || '---'}</td>
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
    }

    /**
     * Ouvre la modale d'édition préremplie pour un horaire.
     * @param {ManagementSchedulesController} controller
     * @param {Object} s - Données de l'horaire sélectionné
     */
    showEditScheduleModal(controller, s) {
        const selectedClassId = s.id_classe || '';
        const selectedMatiereId = s.id_matiere || '';
        this.parent._showModal(`
            <h3>Modifier l'horaire</h3>
            <div class="form-container">
                <select id="edit-sched-classe">${this.parent._renderClassOptions(selectedClassId, true)}</select>
                <select id="edit-sched-matiere">${this.parent._renderMatiereOptions(selectedMatiereId, true)}</select>
                <select id="edit-sched-jour">
                    <option value="lundi" ${s.jour_semaine === 'lundi' ? 'selected' : ''}>Lundi</option>
                    <option value="mardi" ${s.jour_semaine === 'mardi' ? 'selected' : ''}>Mardi</option>
                    <option value="mercredi" ${s.jour_semaine === 'mercredi' ? 'selected' : ''}>Mercredi</option>
                    <option value="jeudi" ${s.jour_semaine === 'jeudi' ? 'selected' : ''}>Jeudi</option>
                    <option value="vendredi" ${s.jour_semaine === 'vendredi' ? 'selected' : ''}>Vendredi</option>
                    <option value="samedi" ${s.jour_semaine === 'samedi' ? 'selected' : ''}>Samedi</option>
                </select>
                <select id="edit-sched-debut">${this.parent._renderCreneauDebutOptions(s.id_creneau_debut || '')}</select>
                <select id="edit-sched-fin">${this.parent._renderCreneauFinOptions(s.id_creneau_fin || '')}</select>
                <input type="text" id="edit-sched-salle" value="${s.salle || ''}" placeholder="Salle">
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
                salle: document.getElementById('edit-sched-salle').value,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

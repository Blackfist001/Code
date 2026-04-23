import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de gestion des étudiants.
 * Affiche le tableau des étudiants, les filtres classe/ midi, et la modale d'édition.
 */
export default class ManagementStudentsView {
    constructor(parent) {
        this.parent = parent;
        this._allStudents = [];
    }

    /**
     * Branche les écouteurs du formulaire d'ajout et des filtres.
     * @param {ManagementStudentsController} controller
     */
    bindEvents(controller) {
        const addStudentBtn = document.getElementById('btn-add-student');
        if (addStudentBtn && controller) {
            addStudentBtn.addEventListener('click', () => {
                const nom = document.getElementById('student-nom')?.value.trim();
                const prenom = document.getElementById('student-prenom')?.value.trim();
                const naissance = document.getElementById('student-naissance')?.value;
                const classe = document.getElementById('student-classe')?.value;
                const midi = document.getElementById('student-midi')?.checked ? 1 : 0;
                controller.addStudent({ nom, prenom, date_naissance: naissance, classe, autorisation_midi: midi });
            });
        }

        ['students-filter-classe', 'students-filter-midi'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this._applyFilters(controller));
        });
    }

    /**
     * Resynchronise les options de classe dans tous les menus déroulants de la section étudiants.
     */
    updateClassOptions() {
        const studentClasseSelect = document.getElementById('student-classe');
        if (studentClasseSelect) {
            studentClasseSelect.innerHTML = this.parent._renderClassOptions('', true);
        }

        const studentsFilterClasse = document.getElementById('students-filter-classe');
        if (studentsFilterClasse) {
            const prev = studentsFilterClasse.value;
            studentsFilterClasse.innerHTML = this.parent._renderClassOptions('', true)
                .replace('-- Classe --', '-- Toutes les classes --');
            studentsFilterClasse.value = prev;
        }
    }

    /**
     * Filtre les étudiants stockés selon les valeurs des filtres DOM (classe, midi).
     * @returns {Array}
     */
    _getFilteredStudents() {
        const classeFilter = (document.getElementById('students-filter-classe')?.value || '').trim();
        const midiFilter = document.getElementById('students-filter-midi')?.value ?? '';

        return (this._allStudents || []).filter(s => {
            if (classeFilter) {
                const classId = String(s.classe_id ?? s.id_classe ?? '');
                const classNom = String(s.classe || '').toLowerCase();
                const classObj = (this.parent._classes || []).find(c => String(c.id_classe) === classeFilter);
                if (classObj) {
                    if (classNom !== classObj.classe.toLowerCase()) return false;
                } else if (classId !== classeFilter) {
                    return false;
                }
            }

            if (midiFilter !== '' && String(s.autorisation_midi ?? '') !== midiFilter) return false;
            return true;
        });
    }

    /**
     * Injecte les lignes du tableau pour la liste d'étudiants donnée.
     * @param {ManagementStudentsController} controller
     * @param {Array} [students=[]] - Tableau des étudiants à afficher
     */
    _renderRows(controller, students = []) {
        const tbody = document.getElementById('students-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!students.length) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun étudiant pour ce filtre</td></tr>';
            return;
        }

        students.forEach(s => {
            const totalDemiJournees = Number(s.demi_journee_absence) || 0;
            const demiJourneeClass = totalDemiJournees >= 9 ? 'demi-journee-critical' : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.nom || '---'}</td>
                <td>${s.prenom || '---'}</td>
                <td>${s.classe || '---'}</td>
                <td>${s.date_naissance || '---'}</td>
                <td>${s.autorisation_midi == 1 ? '✓' : '✗'}</td>
                <td><span class="${demiJourneeClass}">${totalDemiJournees}</span></td>
                <td>
                    <button class="btn-edit-student" data-id="${s.id_etudiant}">Modifier</button>
                    <button class="btn-delete-student" data-id="${s.id_etudiant}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-student').forEach(btn => {
            btn.addEventListener('click', () => {
                const student = (this._allStudents || []).find(s => String(s.id_etudiant) === btn.dataset.id);
                if (student) this.showEditStudentModal(controller, student);
            });
        });

        tbody.querySelectorAll('.btn-delete-student').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer cet étudiant ? Ses passages seront également supprimés.')) {
                    controller.deleteStudent(btn.dataset.id);
                }
            });
        });
    }

    /**
     * Re-filtre et re-rend les lignes après un changement de filtre.
     * @param {ManagementStudentsController} controller
     */
    _applyFilters(controller) {
        this._renderRows(controller, this._getFilteredStudents());
    }

    /**
     * Stocke la liste complète des étudiants et met à jour l'affichage.
     * @param {ManagementStudentsController} controller
     * @param {Array} [students=[]] - Liste complète des étudiants
     */
    displayStudents(controller, students = []) {
        this._allStudents = Array.isArray(students) ? students : [];
        this._applyFilters(controller);
    }

    /**
     * Ouvre la modale d'édition préremplie pour un étudiant.
     * @param {ManagementStudentsController} controller
     * @param {Object} student - Données de l'étudiant sélectionné
     */
    showEditStudentModal(controller, student) {
        this.parent._showModal(`
            <h3>Modifier l'étudiant</h3>
            <div class="form-container">
                <input type="text" id="edit-nom" value="${student.nom || ''}" placeholder="Nom">
                <input type="text" id="edit-prenom" value="${student.prenom || ''}" placeholder="Prénom">
                <input type="text" id="edit-classe" value="${student.classe || ''}" placeholder="Classe (ex: 2A)">
                <input type="date" id="edit-naissance" value="${student.date_naissance || ''}">
                <label style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="edit-midi" ${student.autorisation_midi == 1 ? 'checked' : ''}>
                    Autorisation sortie midi
                </label>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updateStudent(student.id_etudiant, {
                nom: document.getElementById('edit-nom').value,
                prenom: document.getElementById('edit-prenom').value,
                classe: document.getElementById('edit-classe').value,
                date_naissance: document.getElementById('edit-naissance').value,
                autorisation_midi: document.getElementById('edit-midi').checked ? 1 : 0,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

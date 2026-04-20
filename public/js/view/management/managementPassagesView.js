import { confirmDialog } from '../../utils/dialog.js';

export default class ManagementPassagesView {
    constructor(parent) {
        this.parent = parent;
        this._allPassageStudents = [];
    }

    bindEvents(controller) {
        const filterBtn = document.getElementById('btn-filter-passages');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                const dateFrom = document.getElementById('passages-filter-date-from').value;
                const dateTo = document.getElementById('passages-filter-date-to').value;
                if (dateFrom || dateTo) {
                    controller.loadPassagesByDateRange(dateFrom, dateTo);
                } else {
                    controller.loadPassages();
                }
            });
        }

        const exportPassagesBtn = document.getElementById('btn-export-passages-csv');
        if (exportPassagesBtn) {
            exportPassagesBtn.addEventListener('click', () => {
                const dateFrom = document.getElementById('passages-filter-date-from')?.value || '';
                const dateTo = document.getElementById('passages-filter-date-to')?.value || '';
                if (dateFrom && dateTo) {
                    controller.exportPassagesCSV(dateFrom, dateTo);
                } else {
                    alert('Veuillez sélectionner une plage de dates');
                }
            });
        }

        const passageClasse = document.getElementById('passage-classe');
        const passageNom = document.getElementById('passage-name-student');
        const passagePrenom = document.getElementById('passage-surname-student');
        const addPassageBtn = document.getElementById('btn-add-passage');

        if (passageClasse) {
            passageClasse.addEventListener('change', () => this._refreshPassageNameOptions());
        }
        if (passageNom) {
            passageNom.addEventListener('change', () => {
                this._refreshPassageSurnameOptions();
                this._syncPassageStudentSelection();
            });
        }
        if (passagePrenom) {
            passagePrenom.addEventListener('change', () => this._syncPassageStudentSelection());
        }
        if (addPassageBtn) {
            addPassageBtn.addEventListener('click', () => {
                const idEtudiant = document.getElementById('passage-id-student')?.value || '';
                const typePassage = document.getElementById('passage-type')?.value || 'Entrée matin';
                const datePassage = document.getElementById('passage-date')?.value || '';
                const heurePassage = document.getElementById('passage-time')?.value || '';
                controller.addPassage({
                    id_etudiant: idEtudiant,
                    type_passage: typePassage,
                    date_passage: datePassage,
                    heure_passage: heurePassage,
                });
            });
        }

        this._setDefaultDateTime();
    }

    _setDefaultDateTime() {
        const now = new Date();
        const dateEl = document.getElementById('passage-date');
        const timeEl = document.getElementById('passage-time');
        if (dateEl && !dateEl.value) {
            dateEl.value = now.toISOString().split('T')[0];
        }
        if (timeEl && !timeEl.value) {
            timeEl.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    }

    setPassageStudents(students = []) {
        this._allPassageStudents = Array.isArray(students) ? students : [];
        this._refreshPassageNameOptions();
    }

    _getClassLabelById(classId) {
        const cls = (this.parent._classes || []).find(c => String(c.id_classe) === String(classId));
        return cls ? String(cls.classe || '') : '';
    }

    updateClassOptions() {
        const passageClasseSelect = document.getElementById('passage-classe');
        if (passageClasseSelect) {
            const prev = passageClasseSelect.value;
            passageClasseSelect.innerHTML = this.parent._renderClassOptions('', true)
                .replace('-- Classe --', '-- Choisir une classe --');
            passageClasseSelect.value = prev;
            this._refreshPassageNameOptions();
        }
    }

    _refreshPassageNameOptions() {
        const classId = document.getElementById('passage-classe')?.value || '';
        const nameSelect = document.getElementById('passage-name-student');
        const surnameSelect = document.getElementById('passage-surname-student');
        const hiddenId = document.getElementById('passage-id-student');
        const addBtn = document.getElementById('btn-add-passage');
        if (!nameSelect || !surnameSelect || !hiddenId || !addBtn) return;

        if (!classId) {
            nameSelect.innerHTML = '<option value="">-- Nom --</option>';
            surnameSelect.innerHTML = '<option value="">-- Prénom --</option>';
            nameSelect.disabled = true;
            surnameSelect.disabled = true;
            hiddenId.value = '';
            addBtn.disabled = true;
            return;
        }

        const classLabel = this._getClassLabelById(classId);
        const students = (this._allPassageStudents || []).filter(s => {
            const sid = String(s.classe_id ?? s.id_classe ?? '');
            if (sid && sid === String(classId)) return true;
            return classLabel && String(s.classe || '').toLowerCase() === classLabel.toLowerCase();
        });

        const names = [...new Set(students.map(s => String(s.nom || '').trim()).filter(Boolean))].sort();
        nameSelect.innerHTML = '<option value="">-- Nom --</option>'
            + names.map(n => `<option value="${n}">${n}</option>`).join('');
        surnameSelect.innerHTML = '<option value="">-- Prénom --</option>';
        nameSelect.disabled = false;
        surnameSelect.disabled = true;
        hiddenId.value = '';
        addBtn.disabled = true;
    }

    _refreshPassageSurnameOptions() {
        const classId = document.getElementById('passage-classe')?.value || '';
        const selectedName = document.getElementById('passage-name-student')?.value || '';
        const surnameSelect = document.getElementById('passage-surname-student');
        if (!surnameSelect) return;

        if (!classId || !selectedName) {
            surnameSelect.innerHTML = '<option value="">-- Prénom --</option>';
            surnameSelect.disabled = true;
            return;
        }

        const classLabel = this._getClassLabelById(classId);
        const students = (this._allPassageStudents || []).filter(s => {
            const sid = String(s.classe_id ?? s.id_classe ?? '');
            const classMatch = (sid && sid === String(classId))
                || (classLabel && String(s.classe || '').toLowerCase() === classLabel.toLowerCase());
            return classMatch && String(s.nom || '') === selectedName;
        });

        const surnames = [...new Set(students.map(s => String(s.prenom || '').trim()).filter(Boolean))].sort();
        surnameSelect.innerHTML = '<option value="">-- Prénom --</option>'
            + surnames.map(p => `<option value="${p}">${p}</option>`).join('');
        surnameSelect.disabled = false;
    }

    _syncPassageStudentSelection() {
        const classId = document.getElementById('passage-classe')?.value || '';
        const nom = document.getElementById('passage-name-student')?.value || '';
        const prenom = document.getElementById('passage-surname-student')?.value || '';
        const hiddenId = document.getElementById('passage-id-student');
        const addBtn = document.getElementById('btn-add-passage');
        if (!hiddenId || !addBtn) return;

        const classLabel = this._getClassLabelById(classId);
        const student = (this._allPassageStudents || []).find(s => {
            const sid = String(s.classe_id ?? s.id_classe ?? '');
            const classMatch = (sid && sid === String(classId))
                || (classLabel && String(s.classe || '').toLowerCase() === classLabel.toLowerCase());
            return classMatch && String(s.nom || '') === nom && String(s.prenom || '') === prenom;
        });

        hiddenId.value = student ? String(student.id_etudiant || '') : '';
        addBtn.disabled = !hiddenId.value;
    }

    displayPassages(controller, passages = []) {
        const tbody = document.getElementById('passages-gestion-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!passages.length) {
            tbody.innerHTML = '<tr><td colspan="8">Aucun passage</td></tr>';
            return;
        }

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT = ['Présent', 'Autorisé'];

        passages.forEach(p => {
            const statut = p.statut || '---';
            const sc = STATUT_ROUGE.includes(statut) ? 'status-refuse' : STATUT_VERT.includes(statut) ? 'status-present' : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.date_passage || '---'}</td>
                <td>${p.heure_passage || '---'}</td>
                <td>${p.nom || '---'}</td>
                <td>${p.prenom || '---'}</td>
                <td>${p.classe || '---'}</td>
                <td>${p.type_passage || '---'}</td>
                <td><span class="status-badge ${sc}">${statut}</span></td>
                <td>
                    <button class="btn-edit-passage" data-id="${p.id_passage}">Modifier</button>
                    <button class="btn-delete-passage" data-id="${p.id_passage}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-passage').forEach(btn => {
            btn.addEventListener('click', () => {
                const passage = passages.find(p => String(p.id_passage) === btn.dataset.id);
                if (passage) this.showEditPassageModal(controller, passage);
            });
        });

        tbody.querySelectorAll('.btn-delete-passage').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer ce passage ?')) controller.deletePassage(btn.dataset.id);
            });
        });
    }

    showEditPassageModal(controller, passage) {
        this.parent._showModal(`
            <h3>Modifier le passage</h3>
            <div class="form-container">
                <label>Date</label>
                <input type="date" id="edit-date" value="${passage.date_passage || ''}">
                <label>Heure</label>
                <input type="time" id="edit-heure" value="${(passage.heure_passage || '').substring(0, 5)}">
                <label>Type</label>
                <select id="edit-type">
                    <option value="Entrée matin" ${passage.type_passage === 'Entrée matin' ? 'selected' : ''}>Entrée matin</option>
                    <option value="Sortie midi" ${passage.type_passage === 'Sortie midi' ? 'selected' : ''}>Sortie midi</option>
                    <option value="Rentrée midi" ${passage.type_passage === 'Rentrée midi' ? 'selected' : ''}>Rentrée midi</option>
                    <option value="Entrée après-midi" ${passage.type_passage === 'Entrée après-midi' ? 'selected' : ''}>Entrée après-midi</option>
                    <option value="Sortie autorisée" ${passage.type_passage === 'Sortie autorisée' ? 'selected' : ''}>Sortie autorisée</option>
                    <option value="Journée" ${passage.type_passage === 'Journée' ? 'selected' : ''}>Journée</option>
                </select>
                <label>Statut</label>
                <select id="edit-statut">
                    <option value="Présent" ${passage.statut === 'Présent' ? 'selected' : ''}>Présent</option>
                    <option value="Autorisé" ${passage.statut === 'Autorisé' ? 'selected' : ''}>Autorisé</option>
                    <option value="En retard" ${passage.statut === 'En retard' ? 'selected' : ''}>En retard</option>
                    <option value="Absent" ${passage.statut === 'Absent' ? 'selected' : ''}>Absent</option>
                    <option value="Refusé" ${passage.statut === 'Refusé' ? 'selected' : ''}>Refusé</option>
                    <option value="Absence justifiée" ${passage.statut === 'Absence justifiée' ? 'selected' : ''}>Absence justifiée</option>
                    <option value="Sortie justifiée" ${passage.statut === 'Sortie justifiée' ? 'selected' : ''}>Sortie justifiée</option>
                </select>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            controller.updatePassage(passage.id_passage, {
                date_passage: document.getElementById('edit-date').value,
                heure_passage: document.getElementById('edit-heure').value,
                type_passage: document.getElementById('edit-type').value,
                statut: document.getElementById('edit-statut').value,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

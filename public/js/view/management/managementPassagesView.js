import api from '../../api.js';
import { confirmDialog } from '../../utils/dialog.js';

/**
 * Sous-vue de gestion des passages.
 * Affiche le tableau des passages, les filtres, les sélecteurs cascadés et la modale d'édition.
 */
export default class ManagementPassagesView {
    constructor(parent) {
        this.parent = parent;
        this._allPassageStudents = [];
        this._typeOptions = null;
        this._statusOptions = null;
        this._reasonOptions = null;
        this._passageMetadataReady = false;
    }

    async _ensurePassageMetadataLoaded() {
        if (Array.isArray(this._typeOptions) && Array.isArray(this._statusOptions) && Array.isArray(this._reasonOptions)) {
            return;
        }

        try {
            const [typesResponse, statusesResponse, reasonsResponse] = await Promise.all([
                api.getPassageMetadata('types'),
                api.getPassageMetadata('statuses'),
                api.getPassageMetadata('reasons'),
            ]);

            this._typeOptions = (typesResponse?.success ? (typesResponse.results || []) : [])
                .map(item => String(item?.label || '').trim())
                .filter(Boolean);
            this._statusOptions = (statusesResponse?.success ? (statusesResponse.results || []) : [])
                .map(item => String(item?.label || '').trim())
                .filter(Boolean);
            this._reasonOptions = (reasonsResponse?.success ? (reasonsResponse.results || []) : [])
                .map(item => String(item?.label || '').trim())
                .filter(Boolean);
        } catch (_) {
            this._typeOptions = [];
            this._statusOptions = [];
            this._reasonOptions = [];
        }

        this._passageMetadataReady = this._typeOptions.length > 0 && this._statusOptions.length > 0;

        if (!this._passageMetadataReady) {
            this._notify('Métadonnées types/statuts indisponibles depuis la base.', 'error');
        }
    }

    _getStatutsByType(typePassage = '') {
        const statutsParType = {
            'Aucun': ['Présent'],
            'Entrée matin': ['Présent', 'En retard'],
            'Rentrée midi': ['Présent', 'En retard'],
            'Entrée après-midi': ['Présent', 'En retard'],
            'Sortie midi': ['Autorisé', 'Refusé'],
            'Journée': ['Présent', 'Absent', 'Absence justifiée'],
            'Sortie autorisée': ['Autorisé'],
        };

        const defaults = statutsParType[String(typePassage || '').trim()] || ['Présent'];
        const available = Array.isArray(this._statusOptions) && this._statusOptions.length
            ? this._statusOptions
            : [];
        const filtered = defaults.filter(status => available.includes(status));
        return filtered.length ? filtered : [];
    }

    _isStatusHiddenForType(typePassage = '') {
        return String(typePassage || '').trim().toLowerCase() === 'aucun';
    }

    _shouldShowReason(typePassage = '', statut = '') {
        const normalizedType = String(typePassage || '').trim();
        const normalizedStatus = String(statut || '').trim();

        return normalizedType === 'Sortie autorisée'
            || (normalizedType === 'Journée' && normalizedStatus === 'Absence justifiée');
    }

    async _getReasonOptions() {
        await this._ensurePassageMetadataLoaded();
        return this._reasonOptions;
    }

    _renderTypeOptions(selectedType = '') {
        const options = [];
        (this._typeOptions || []).forEach(type => {
            const selected = String(selectedType || '') === String(type) ? ' selected' : '';
            options.push(`<option value="${type}"${selected}>${type}</option>`);
        });
        if (!options.length) {
            const fallbackLabel = String(selectedType || '').trim();
            if (fallbackLabel) {
                return `<option value="${fallbackLabel}">${fallbackLabel}</option>`;
            }
            return '<option value="">-- Type indisponible --</option>';
        }
        return options.join('');
    }

    _renderReasonOptions(selectedReason = '') {
        const options = ['<option value="">-- Raison --</option>'];
        (this._reasonOptions || []).forEach(reason => {
            const selected = String(selectedReason || '') === String(reason) ? ' selected' : '';
            options.push(`<option value="${reason}"${selected}>${reason}</option>`);
        });
        return options.join('');
    }

    _bindEditPassageDependentFields(passage) {
        const typeSelect = document.getElementById('edit-type');
        const statusSelect = document.getElementById('edit-statut');
        const reasonLabel = document.getElementById('edit-reason-label');
        const reasonWrapper = document.getElementById('edit-reason-wrapper');
        const reasonSelect = document.getElementById('edit-reason');
        if (!typeSelect || !statusSelect || !reasonWrapper || !reasonSelect) return;

        const refresh = () => {
            const type = typeSelect.value;
            const previousStatus = statusSelect.value;
            const statusOptions = this._getStatutsByType(type);

            statusSelect.innerHTML = '';
            statusOptions.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });

            const fallbackStatus = statusOptions.includes(passage.statut) ? passage.statut : statusOptions[0];
            statusSelect.value = statusOptions.includes(previousStatus) ? previousStatus : fallbackStatus;

            const showReason = this._shouldShowReason(typeSelect.value, statusSelect.value);
            if (reasonLabel) {
                reasonLabel.style.display = showReason ? 'block' : 'none';
            }
            reasonWrapper.style.display = showReason ? 'block' : 'none';
            if (!showReason) {
                reasonSelect.value = '';
            }
        };

        typeSelect.addEventListener('change', refresh);
        statusSelect.addEventListener('change', () => {
            const showReason = this._shouldShowReason(typeSelect.value, statusSelect.value);
            if (reasonLabel) {
                reasonLabel.style.display = showReason ? 'block' : 'none';
            }
            reasonWrapper.style.display = showReason ? 'block' : 'none';
            if (!showReason) {
                reasonSelect.value = '';
            }
        });

        refresh();
        if (this._shouldShowReason(typeSelect.value, statusSelect.value)) {
            reasonSelect.value = passage.raison || passage.reason || '';
        }
    }

    _notify(message, type = 'info') {
        if (message && window.AppNotifier && typeof window.AppNotifier.notify === 'function') {
            window.AppNotifier.notify(message, type);
            return;
        }
        alert(message);
    }

    notify(message, type = 'info') {
        this._notify(message, type);
    }

    _resolvePassageId(passage) {
        return String(passage?.id_passage ?? passage?.id ?? passage?.id_mouvement ?? '').trim();
    }

    /**
     * Branche les écouteurs sur les boutons filtre, export et ajout de passage.
     * @param {ManagementPassagesController} controller
     */
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
                    this._notify('Veuillez sélectionner une plage de dates', 'warning');
                }
            });
        }

        const passageClasse = document.getElementById('passage-classe');
        const passageNom = document.getElementById('passage-name-student');
        const passagePrenom = document.getElementById('passage-surname-student');
        const addPassageBtn = document.getElementById('btn-add-passage');
        const passageType = document.getElementById('passage-type');
        const passageStatut = document.getElementById('passage-statut');
        const passageStatutWrapper = document.getElementById('passage-statut-wrapper');
        const passageReason = document.getElementById('passage-raison');
        const passageReasonWrapper = document.getElementById('passage-reason-wrapper');

        this._ensurePassageMetadataLoaded().then(() => {
            if (passageType) {
                const prevType = passageType.value;
                passageType.innerHTML = this._renderTypeOptions(prevType);
            }
            if (passageReason) {
                passageReason.innerHTML = this._renderReasonOptions(passageReason.value || '');
            }
            if (passageType && passageStatut) {
                const statusOptions = this._getStatutsByType(passageType.value || (this._typeOptions?.[0] || ''));
                const prevStatus = passageStatut.value;
                passageStatut.innerHTML = '';
                statusOptions.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    passageStatut.appendChild(option);
                });
                if (!statusOptions.length) {
                    passageStatut.innerHTML = '<option value="">-- Statut indisponible --</option>';
                }
                passageStatut.value = statusOptions.includes(prevStatus) ? prevStatus : (statusOptions[0] || '');
            }
        }).catch(() => {});

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
                if (!this._passageMetadataReady) {
                    this._notify('Impossible d\'ajouter: métadonnées de passage indisponibles.', 'error');
                    return;
                }
                const idEtudiant = document.getElementById('passage-id-student')?.value || '';
                const typePassage = document.getElementById('passage-type')?.value || '';
                const datePassage = document.getElementById('passage-date')?.value || '';
                const heurePassage = document.getElementById('passage-time')?.value || '';
                controller.addPassage({
                    id_etudiant: idEtudiant,
                    type_passage: typePassage,
                    statut: passageStatut?.value || '',
                    raison: this._shouldShowReason(typePassage, passageStatut?.value || '')
                        ? (passageReason?.value || null)
                        : null,
                    date_passage: datePassage,
                    heure_passage: heurePassage,
                });
            });
        }

        const refreshAddPassageDependentFields = async () => {
            if (!passageType || !passageStatut || !passageReason || !passageReasonWrapper) return;

            await this._getReasonOptions();
            passageReason.innerHTML = this._renderReasonOptions(passageReason.value || '');

            const statusOptions = this._getStatutsByType(passageType.value);
            const hideStatus = this._isStatusHiddenForType(passageType.value);
            const safeStatusOptions = statusOptions.length
                ? statusOptions
                : (Array.isArray(this._statusOptions) && this._statusOptions.length ? [this._statusOptions[0]] : []);
            const previousStatus = passageStatut.value;
            passageStatut.innerHTML = '';
            safeStatusOptions.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                passageStatut.appendChild(option);
            });
            if (!safeStatusOptions.length) {
                passageStatut.innerHTML = '<option value="">-- Statut indisponible --</option>';
            }
            passageStatut.value = safeStatusOptions.includes(previousStatus) ? previousStatus : (safeStatusOptions[0] || '');
            if (passageStatutWrapper) {
                passageStatutWrapper.style.display = hideStatus ? 'none' : 'block';
            } else {
                passageStatut.style.display = hideStatus ? 'none' : 'block';
            }

            const showReason = this._shouldShowReason(passageType.value, passageStatut.value);
            passageReasonWrapper.style.display = showReason ? 'block' : 'none';
            if (!showReason) {
                passageReason.value = '';
            }
        };

        if (passageType && passageStatut) {
            passageType.addEventListener('change', () => {
                refreshAddPassageDependentFields();
            });
            passageStatut.addEventListener('change', () => {
                const showReason = this._shouldShowReason(passageType.value, passageStatut.value);
                if (passageReasonWrapper) {
                    passageReasonWrapper.style.display = showReason ? 'block' : 'none';
                }
                if (!showReason && passageReason) {
                    passageReason.value = '';
                }
            });

            refreshAddPassageDependentFields();
        }

        this._setDefaultDateTime();
    }

    /**
     * Pré-remplit les champs date/heure du formulaire avec l'heure courante.
     */
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

    /**
     * Stocke la liste d'étudiants et l'injecte dans le sélecteur du formulaire.
     * @param {Array} [students=[]] - Tableau des étudiants disponibles
     */
    setPassageStudents(students = []) {
        this._allPassageStudents = Array.isArray(students) ? students : [];
        this._refreshPassageNameOptions();
    }

    /**
     * Retourne le libellé de classe correspondant à un ID.
     * @param {number|string} classId
     * @returns {string}
     */
    _getClassLabelById(classId) {
        const cls = (this.parent._classes || []).find(c => String(c.id_classe) === String(classId));
        return cls ? String(cls.classe || '') : '';
    }

    /**
     * Met à jour le menu déroulant de classe dans le formulaire de passage.
     */
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

    /**
     * Recharge la liste des noms selon la classe sélectionnée.
     */
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

    /**
     * Recharge la liste des prénoms selon la classe et le nom sélectionnés.
     */
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

    /**
     * Synchronise le champ caché id_etudiant et l'état du bouton d'ajout
     * selon la combinaison classe/nom/prénom sélectionnée.
     */
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

    /**
     * Peuple le tableau des passages avec les lignes édit/suppr.
     * @param {ManagementPassagesController} controller
     * @param {Array} [passages=[]] - Liste des passages à afficher
     */
    displayPassages(controller, passages = []) {
        const tbody = document.getElementById('passages-gestion-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!passages.length) {
            tbody.innerHTML = '<tr><td colspan="9">Aucun passage</td></tr>';
            return;
        }

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT = ['Présent', 'Autorisé'];

        passages.forEach(p => {
            const passageId = this._resolvePassageId(p);
            const statut = p.statut || '---';
            const sc = STATUT_ROUGE.includes(statut) ? 'status-refuse' : STATUT_VERT.includes(statut) ? 'status-present' : 'status-info';
            const typeLabel = p.type_passage || '---';
            const typeClass = 'status-info';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.date_passage || '---'}</td>
                <td>${p.heure_passage || '---'}</td>
                <td>${p.nom || '---'}</td>
                <td>${p.prenom || '---'}</td>
                <td>${p.classe || '---'}</td>
                <td><span class="status-badge ${typeClass}">${typeLabel}</span></td>
                <td><span class="status-badge ${sc}">${statut}</span></td>
                <td><span class="status-badge status-info">${p.raison || p.reason || '---'}</span></td>
                <td>
                    <button type="button" class="btn-edit btn-edit-passage" data-id="${passageId}">Modifier</button>
                    <button type="button" class="btn-delete btn-delete-passage" data-id="${passageId}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-passage').forEach(btn => {
            btn.addEventListener('click', () => {
                const passage = passages.find(p => this._resolvePassageId(p) === String(btn.dataset.id || ''));
                if (passage) this.showEditPassageModal(controller, passage);
            });
        });

        tbody.querySelectorAll('.btn-delete-passage').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await confirmDialog('Supprimer ce passage ?')) controller.deletePassage(btn.dataset.id);
            });
        });
    }

    /**
     * Ouvre la modale d'édition préremplie pour un passage.
     * @param {ManagementPassagesController} controller
     * @param {Object} passage - Données du passage sélectionné
     */
    async showEditPassageModal(controller, passage) {
        await this._ensurePassageMetadataLoaded();

        const initialType = String(passage.type_passage || '').trim();
        const initialStatut = String(passage.statut || '').trim();
        const initialReason = String(passage.raison || passage.reason || '').trim();

        this.parent._showModal(`
            <h3>Modifier le passage</h3>
            <div class="form-container modal-form-grid">
                <label>Date</label>
                <p class="management-readonly-value">${passage.date_passage || '---'}</p>
                <label>Heure</label>
                <p class="management-readonly-value">${(passage.heure_passage || '').substring(0, 5) || '---'}</p>
                <label for="edit-type">Type</label>
                <select id="edit-type">
                    ${this._renderTypeOptions(initialType)}
                </select>
                <label for="edit-statut">Statut</label>
                <select id="edit-statut"></select>
                <label id="edit-reason-label" for="edit-reason" style="display:none;">Raison</label>
                <div id="edit-reason-wrapper" style="display:none;">
                    <select id="edit-reason">${this._renderReasonOptions(initialReason)}</select>
                </div>
                <div class="modal-row-full modal-form-actions">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);

        const statusSelect = document.getElementById('edit-statut');
        if (statusSelect) {
            const options = this._getStatutsByType(initialType);
            statusSelect.innerHTML = options.map(status => {
                const selected = status === initialStatut ? ' selected' : '';
                return `<option value="${status}"${selected}>${status}</option>`;
            }).join('');
        }

        this._bindEditPassageDependentFields(passage);

        document.getElementById('modal-btn-save').addEventListener('click', () => {
            const selectedType = document.getElementById('edit-type').value;
            const selectedStatut = document.getElementById('edit-statut').value;
            const reasonSelect = document.getElementById('edit-reason');
            controller.updatePassage(this._resolvePassageId(passage), {
                type_passage: selectedType,
                statut: selectedStatut,
                raison: this._shouldShowReason(selectedType, selectedStatut)
                    ? (reasonSelect?.value || null)
                    : null,
            });
            this.parent._hideModal();
        });

        document.getElementById('modal-btn-cancel').addEventListener('click', () => this.parent._hideModal());
    }
}

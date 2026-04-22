import '../../vendor/easy.qrcode.min.js';

export default class ManagementQrCodesView {
    constructor(parent) {
        this.parent = parent;
        this._allStudents = [];
    }

    bindEvents() {
        const classeSelect = document.getElementById('qrcodes-filter-classe');
        const nomSelect = document.getElementById('qrcodes-filter-nom');
        const prenomSelect = document.getElementById('qrcodes-filter-prenom');

        if (classeSelect) {
            classeSelect.addEventListener('change', () => {
                this._refreshNameOptions();
                this._refreshSurnameOptions();
                this._renderFilteredList();
            });
        }

        if (nomSelect) {
            nomSelect.addEventListener('change', () => {
                this._refreshSurnameOptions();
                this._renderFilteredList();
            });
        }

        if (prenomSelect) {
            prenomSelect.addEventListener('change', () => {
                this._renderFilteredList();
            });
        }
    }

    _getClassLabelById(classId) {
        const cls = (this.parent._classes || []).find(c => String(c.id_classe) === String(classId));
        return cls ? String(cls.classe || '') : '';
    }

    updateClassOptions() {
        const classeSelect = document.getElementById('qrcodes-filter-classe');
        if (!classeSelect) return;

        const previousValue = classeSelect.value;
        classeSelect.innerHTML = this.parent._renderClassOptions('', true);
        classeSelect.value = previousValue;

        this._refreshNameOptions();
        this._refreshSurnameOptions();
        this._renderFilteredList();
    }

    _studentsForSelectedClass() {
        const classId = (document.getElementById('qrcodes-filter-classe')?.value || '').trim();
        if (!classId) return [...(this._allStudents || [])];

        const classLabel = this._getClassLabelById(classId);
        return (this._allStudents || []).filter(student => {
            const sid = String(student.classe_id ?? student.id_classe ?? '');
            const matchesId = sid && sid === classId;
            const matchesLabel = classLabel && String(student.classe || '').toLowerCase() === classLabel.toLowerCase();
            return matchesId || matchesLabel;
        });
    }

    _refreshNameOptions() {
        const nomSelect = document.getElementById('qrcodes-filter-nom');
        if (!nomSelect) return;

        const previousValue = nomSelect.value;
        const names = [...new Set(this._studentsForSelectedClass().map(s => String(s.nom || '').trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'fr'));

        nomSelect.innerHTML = '<option value="">-- Nom --</option>'
            + names.map(name => `<option value="${name}">${name}</option>`).join('');

        if (names.includes(previousValue)) {
            nomSelect.value = previousValue;
        }
    }

    _refreshSurnameOptions() {
        const prenomSelect = document.getElementById('qrcodes-filter-prenom');
        const nomSelect = document.getElementById('qrcodes-filter-nom');
        if (!prenomSelect) return;

        const selectedName = (nomSelect?.value || '').trim();
        const previousValue = prenomSelect.value;

        let students = this._studentsForSelectedClass();
        if (selectedName) {
            students = students.filter(s => String(s.nom || '').trim() === selectedName);
        }

        const firstNames = [...new Set(students.map(s => String(s.prenom || '').trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'fr'));

        prenomSelect.innerHTML = '<option value="">-- Prénom --</option>'
            + firstNames.map(firstName => `<option value="${firstName}">${firstName}</option>`).join('');

        if (firstNames.includes(previousValue)) {
            prenomSelect.value = previousValue;
        }
    }

    _filteredStudents() {
        const classe = (document.getElementById('qrcodes-filter-classe')?.value || '').trim();
        const nom = (document.getElementById('qrcodes-filter-nom')?.value || '').trim();
        const prenom = (document.getElementById('qrcodes-filter-prenom')?.value || '').trim();

        const hasFilter = Boolean(classe || nom || prenom);
        if (!hasFilter) {
            return { hasFilter: false, results: [] };
        }

        const classLabel = this._getClassLabelById(classe);

        const results = (this._allStudents || []).filter(student => {
            if (classe) {
                const sid = String(student.classe_id ?? student.id_classe ?? '');
                const matchesId = sid && sid === classe;
                const matchesLabel = classLabel && String(student.classe || '').toLowerCase() === classLabel.toLowerCase();
                if (!matchesId && !matchesLabel) return false;
            }
            if (nom && String(student.nom || '').trim() !== nom) return false;
            if (prenom && String(student.prenom || '').trim() !== prenom) return false;
            return true;
        }).sort((a, b) => {
            const byNom = String(a.nom || '').localeCompare(String(b.nom || ''), 'fr');
            if (byNom !== 0) return byNom;
            return String(a.prenom || '').localeCompare(String(b.prenom || ''), 'fr');
        });

        return { hasFilter: true, results };
    }

    _showMessage(message = '', type = 'info') {
        const box = document.getElementById('qrcodes-message');
        if (!box) return;
        box.textContent = message;
        box.className = `message message-${type}`;
    }

    _renderQrCode(container, sourcedId) {
        if (!container || !sourcedId || !window.QRCode) return;

        container.innerHTML = '';
        new window.QRCode(container, {
            text: sourcedId,
            width: 68,
            height: 68,
            colorDark: '#1f2937',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.M,
        });
    }

    _bindExportButtons() {
        document.querySelectorAll('.btn-export-qr-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                const sourcedId = String(btn.dataset.sourcedid || '').trim();
                if (!sourcedId) {
                    this._showMessage('Aucun sourcedId pour cet étudiant.', 'warning');
                    return;
                }

                this._showMessage('Export PDF indisponible pour le moment (bibliothèque PDF à installer).', 'warning');
                alert(`Export PDF à venir pour le sourcedId : ${sourcedId}`);
            });
        });
    }

    _renderFilteredList() {
        const listContainer = document.getElementById('qrcodes-students-list');
        if (!listContainer) return;

        const { hasFilter, results } = this._filteredStudents();
        listContainer.innerHTML = '';

        if (!hasFilter) {
            this._showMessage('Sélectionnez au moins un filtre pour afficher les étudiants.', 'info');
            return;
        }

        this._showMessage('');

        if (!results.length) {
            listContainer.innerHTML = '<p class="historical-empty">Aucun étudiant pour ce filtre.</p>';
            return;
        }

        const header = document.createElement('div');
        header.className = 'historical-list-header';
        header.innerHTML = `
            <span class="historical-date">SourcedId</span>
            <span class="historical-student">Nom Prénom</span>
            <span class="historical-class">Classe</span>
            <span class="historical-type">QR Code</span>
            <span class="historical-status">Export PDF</span>
        `;
        listContainer.appendChild(header);

        const list = document.createElement('ul');
        list.className = 'historical-list';

        results.forEach((student, index) => {
            const sourcedId = String(student.sourcedId || '').trim();
            const qrContainerId = `qrcode-cell-${index}`;

            const item = document.createElement('li');
            item.className = 'historical-list-item';
            item.innerHTML = `
                <span class="historical-date">${sourcedId || '---'}</span>
                <span class="historical-student">${student.nom || '---'} ${student.prenom || ''}</span>
                <span class="historical-class">${student.classe || '---'}</span>
                <span class="historical-type qrcodes-qr-cell" id="${qrContainerId}">${sourcedId ? '' : '---'}</span>
                <span class="historical-status qrcodes-export-cell">
                    <button type="button" class="btn-export-qr-pdf" data-sourcedid="${sourcedId}">Exporter PDF</button>
                </span>
            `;
            list.appendChild(item);

            if (sourcedId) {
                const qrContainer = item.querySelector(`#${qrContainerId}`);
                this._renderQrCode(qrContainer, sourcedId);
            }
        });

        listContainer.appendChild(list);
        this._bindExportButtons();
    }

    displayStudents(controller, students = []) {
        this._allStudents = Array.isArray(students) ? students : [];
        this._refreshNameOptions();
        this._refreshSurnameOptions();
        this._renderFilteredList();
    }
}
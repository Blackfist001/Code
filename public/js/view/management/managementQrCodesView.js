import '../../vendor/easy.qrcode.min.js';
import '../../vendor/jspdf.umd.min.js';

/**
 * Sous-vue d'affichage des QR codes étudiants.
 * Permet de filtrer les étudiants par classe/nom/prénom et affiche leurs QR codes avec export.
 */
export default class ManagementQrCodesView {
    constructor(parent) {
        this.parent = parent;
        this._allStudents = [];
    }

    /**
     * Branche les écouteurs de filtres (classe, nom, prénom) en cascade.
     */
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

        this._bindExportAllButton();
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
     * Met à jour le menu déroulant de classe avec les données courantes.
     */
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

    /**
     * Retourne les étudiants de la classe actuellement sélectionnée (ou tous si aucune).
     * @returns {Array}
     */
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

    /**
     * Recharge les options du filtre nom selon la classe sélectionnée.
     */
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

    /**
     * Recharge les options du filtre prénom selon le nom sélectionné.
     */
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

    /**
     * Retourne les étudiants correspondant à la combinaison classe/nom/prénom des filtres.
     * @returns {Array}
     */
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

    /**
     * Affiche un message dans la zone de notification de la section QR codes.
     * @param {string} [message=''] - Texte du message
     * @param {'info'|'error'} [type='info'] - Type de message
     */
    _showMessage(message = '', type = 'info') {
        const box = document.getElementById('qrcodes-message');
        if (!box) return;
        box.textContent = message;
        box.className = `message message-${type}`;
    }

    /**
     * Génère le QR code d'un étudiant dans le conteneur donné.
     * @param {HTMLElement} container - Élément DOM cible
     * @param {string} sourcedId      - Identifiant unique de l'étudiant
     */
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

    /**
     * Branche les boutons d'export PNG/ imprimer sur chaque carte QR code.
     */
    _bindExportButtons() {
        document.querySelectorAll('.btn-export-qr-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                const sourcedId = String(btn.dataset.sourcedid || '').trim();
                if (!sourcedId) {
                    this._showMessage('Aucun sourcedId pour cet étudiant.', 'error');
                    return;
                }

                const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
                if (!jsPDF) {
                    this._showMessage('Bibliothèque PDF non chargée.', 'error');
                    return;
                }

                // Trouver la carte de cet étudiant dans le DOM
                const listItem = btn.closest('.historical-list-item');
                if (!listItem) return;

                const qrCell = listItem.querySelector('.qrcodes-qr-cell');
                const canvas = qrCell ? qrCell.querySelector('canvas') : null;

                const studentSpan = listItem.querySelector('.historical-student');
                const classSpan   = listItem.querySelector('.historical-class');
                const nomPrenom   = studentSpan ? studentSpan.textContent.trim() : '';
                const classe      = classSpan   ? classSpan.textContent.trim()   : '';

                // Format carte badge : 85.6 x 54 mm (ISO 7810 ID-1)
                const doc = new jsPDF({ format: [85.6, 54], unit: 'mm', orientation: 'landscape' });

                // Fond blanc
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 85.6, 54, 'F');

                // QR code (canvas → PNG)
                if (canvas) {
                    try {
                        const imgData = canvas.toDataURL('image/png');
                        doc.addImage(imgData, 'PNG', 4, 4, 30, 30);
                    } catch (_) { /* canvas tainted ou absent */ }
                }

                // Textes
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(31, 41, 55);
                doc.text(nomPrenom || '---', 38, 14);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                if (classe) doc.text(classe, 38, 21);

                const safeName = (nomPrenom || sourcedId).replace(/[^a-z0-9_-]/gi, '_').substring(0, 40);
                doc.save(`carte-${safeName}.pdf`);

                this._showMessage('PDF exporté avec succès.', 'info');
            });
        });
    }

    /**
     * Active ou désactive le bouton "Exporter tout" selon le nombre de cartes affichées.
     * @param {number} count
     */
    _updateExportAllButtonState(count) {
        const btn = document.getElementById('btn-export-all-qr-pdf');
        if (!btn) return;
        btn.disabled = count < 2;
    }

    /**
     * Branche le bouton "Exporter tous les QR Codes en PDF".
     */
    _bindExportAllButton() {
        const btn = document.getElementById('btn-export-all-qr-pdf');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (!jsPDF) {
                this._showMessage('Bibliothèque PDF non chargée.', 'error');
                return;
            }

            const items = document.querySelectorAll('#qrcodes-students-list .historical-list-item');
            if (items.length < 2) return;

            // Mise en page A4 paysage — grille de badges
            const pageW   = 297;   // mm A4 landscape
            const pageH   = 210;
            const marginX = 10;
            const marginY = 10;
            const badgeW  = 85.6;  // ISO 7810 ID-1
            const badgeH  = 54;
            const gapX    = 4;
            const gapY    = 4;

            const cols    = Math.floor((pageW - marginX * 2 + gapX) / (badgeW + gapX)); // 3
            const rows    = Math.floor((pageH - marginY * 2 + gapY) / (badgeH + gapY)); // 3
            const perPage = cols * rows;

            const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });

            items.forEach((item, index) => {
                const pageIndex  = Math.floor(index / perPage);
                const posOnPage  = index % perPage;
                const col        = posOnPage % cols;
                const row        = Math.floor(posOnPage / cols);

                if (index > 0 && posOnPage === 0) {
                    doc.addPage('a4', 'landscape');
                }

                const bx = marginX + col * (badgeW + gapX);
                const by = marginY + row * (badgeH + gapY);

                // Fond blanc + bordure grise pour délimiter la carte
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(200, 200, 200);
                doc.roundedRect(bx, by, badgeW, badgeH, 2, 2, 'FD');

                const qrCell = item.querySelector('.qrcodes-qr-cell');
                const canvas = qrCell ? qrCell.querySelector('canvas') : null;

                const studentSpan = item.querySelector('.historical-student');
                const classSpan   = item.querySelector('.historical-class');
                const nomPrenom   = studentSpan ? studentSpan.textContent.trim() : '';
                const classe      = classSpan   ? classSpan.textContent.trim()   : '';

                // QR code (calé en haut à gauche de la carte)
                if (canvas) {
                    try {
                        const imgData = canvas.toDataURL('image/png');
                        doc.addImage(imgData, 'PNG', bx + 4, by + 4, 30, 30);
                    } catch (_) { /* canvas tainted ou absent */ }
                }

                // Textes
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(31, 41, 55);
                doc.text(nomPrenom || '---', bx + 38, by + 14);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                if (classe) doc.text(classe, bx + 38, by + 21);
            });

            doc.save('qrcodes-etudiants.pdf');
            this._showMessage(`PDF exporté avec succès (${items.length} cartes, ${Math.ceil(items.length / perPage)} page(s)).`, 'info');
        });
    }

    /**
     * Applique les filtres courants et affiche la liste des cartes QR codes filtrée.
     */
    _renderFilteredList() {
        const listContainer = document.getElementById('qrcodes-students-list');
        if (!listContainer) return;

        const { hasFilter, results } = this._filteredStudents();
        listContainer.innerHTML = '';

        if (!hasFilter) {
            this._showMessage('Sélectionnez au moins un filtre pour afficher les étudiants.', 'info');
            this._updateExportAllButtonState(0);
            return;
        }

        this._showMessage('');

        if (!results.length) {
            listContainer.innerHTML = '<p class="historical-empty">Aucun étudiant pour ce filtre.</p>';
            this._updateExportAllButtonState(0);
            return;
        }

        const header = document.createElement('div');
        header.className = 'historical-list-header';
        header.innerHTML = `
            <span class="historical-date qrcodes-sourcedid-cell">SourcedId</span>
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
                <span class="historical-date qrcodes-sourcedid-cell">${sourcedId || '---'}</span>
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
        this._updateExportAllButtonState(results.length);
    }

    /**
     * Stocke la liste complète des étudiants, initialise les filtres et affiche les QR codes.
     * @param {ManagementQrCodesController} controller
     * @param {Array} [students=[]] - Liste complète des étudiants
     */
    displayStudents(controller, students = []) {
        this._allStudents = Array.isArray(students) ? students : [];
        this._refreshNameOptions();
        this._refreshSurnameOptions();
        this._renderFilteredList();
    }
}
import api from '../api.js';

export default class ManualEncodingView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/manualEncoding.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this._loadClasses();
                this.attachEventListeners();
                this._setCurrentDateTimeDefaults();
                this.refreshHistory();
            })
            .catch(error => console.error('Error loading manual encoding:', error));
    }

    _setCurrentDateTimeDefaults() {
        const now = new Date();
        const dateEl = document.getElementById('encoding-date');
        const timeEl = document.getElementById('encoding-time');

        if (dateEl) {
            dateEl.value = now.toISOString().split('T')[0];
        }
        if (timeEl) {
            timeEl.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    }

    async refreshHistory() {
        const tbody = document.getElementById('encoding-history-body');
        if (!tbody) return;

        try {
            const response = await api.getAllMovements();
            const movements = Array.isArray(response)
                ? response
                : (response?.results || []);

            const hasManualEncodingField = movements.some(m => Object.prototype.hasOwnProperty.call(m, 'manualEncoding'));
            const hasLegacyManualField = movements.some(m => Object.prototype.hasOwnProperty.call(m, 'manual'));
            const manualMovements = hasManualEncodingField
                ? movements.filter(m => Number(m.manualEncoding) === 1)
                : (hasLegacyManualField
                    ? movements.filter(m => Number(m.manual) === 1)
                    : movements);

            tbody.innerHTML = '';

            if (!manualMovements.length) {
                tbody.innerHTML = '<tr><td colspan="6">Aucun encodage manuel enregistré</td></tr>';
                return;
            }

            manualMovements.slice(0, 15).forEach(movement => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${movement.date_passage || '---'}</td>
                    <td>${movement.heure_passage || '---'}</td>
                    <td>${movement.nom || '---'}</td>
                    <td>${movement.prenom || '---'}</td>
                    <td>${movement.type_passage || '---'}</td>
                    <td>${movement.raison || movement.reason || '---'}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="6">Erreur lors du chargement de l\'historique</td></tr>';
        }
    }

    // Charge la liste des classes depuis l'API et alimente le select
    async _loadClasses() {
        try {
            const response = await api.getAllStudents();
            const students = response.success ? response.results ?? response : response;
            this._students = Array.isArray(students) ? students : [];

            const classes = [...new Set((this._students || [])
                .map(student => student?.classe)
                .filter(value => value !== null && value !== undefined && String(value).trim() !== '')
                .map(value => String(value).trim()))]
                .sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' }));

            const classeSelect = document.getElementById('encoding-classe');
            classes.forEach(className => {
                const opt = document.createElement('option');
                opt.value = className;
                opt.textContent = className;
                classeSelect.appendChild(opt);
            });
        } catch (e) {
            this.displayMessage('Erreur chargement classes : ' + e.message, true);
        }
    }

    attachEventListeners() {
        const classeSelect   = document.getElementById('encoding-classe');
        const nomSelect      = document.getElementById('encoding-name-student');
        const prenomSelect   = document.getElementById('encoding-surname-student');
        const addBtn         = document.getElementById('btn-add-encoding');
        const typeSelect     = document.getElementById('encoding-type');
        const reasonSelect   = document.getElementById('encoding-reason');

        // --- Classe choisie → alimente le select Nom ---
        classeSelect.addEventListener('change', () => {
            const classe = String(classeSelect.value || '').trim();
            this._clearStudentSelection();

            // Reset selects
            nomSelect.innerHTML = '<option value="">-- Nom --</option>';
            prenomSelect.innerHTML = '<option value="">-- Prénom --</option>';
            nomSelect.disabled = true;
            prenomSelect.disabled = true;

            if (!classe) return;

            const noms = [...new Set(
                (this._students || [])
                    .filter(s => String(s?.classe || '').trim() === classe)
                    .map(s => s.nom)
                    .filter(Boolean)
            )].sort();

            noms.forEach(nom => {
                const opt = document.createElement('option');
                opt.value = nom;
                opt.textContent = nom;
                nomSelect.appendChild(opt);
            });
            nomSelect.disabled = false;
        });

        // --- Nom choisi → alimente le select Prénom ---
        nomSelect.addEventListener('change', () => {
            const classe = String(classeSelect.value || '').trim();
            const nom    = nomSelect.value;
            this._clearStudentSelection();

            prenomSelect.innerHTML = '<option value="">-- Prénom --</option>';
            prenomSelect.disabled = true;

            if (!nom) return;

            const etudiants = (this._students || []).filter(s => String(s?.classe || '').trim() === classe && s.nom === nom);
            etudiants.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id_etudiant;
                opt.textContent = s.prenom;
                prenomSelect.appendChild(opt);
            });
            prenomSelect.disabled = false;

            // Si un seul étudiant, le sélectionner automatiquement
            if (etudiants.length === 1) {
                prenomSelect.value = etudiants[0].id_etudiant;
                prenomSelect.dispatchEvent(new Event('change'));
            }
        });

        // --- Prénom choisi → sélectionne l'étudiant ---
        prenomSelect.addEventListener('change', () => {
            const studentId = prenomSelect.value;
            if (!studentId) { this._clearStudentSelection(); return; }

            const student = (this._students || []).find(s => String(s.id_etudiant) === String(studentId));
            if (!student) return;

            document.getElementById('encoding-id-student').value = student.id_etudiant;
            const infoDiv = document.getElementById('encoding-student-info');
            infoDiv.textContent = `✓ ${student.prenom} ${student.nom} — ${student.classe}`;
            infoDiv.style.display = 'block';
            addBtn.disabled = false;
        });

        // --- Soumission ---
        addBtn.addEventListener('click', () => {
            const idStudent = document.getElementById('encoding-id-student').value;
            if (!idStudent) {
                this.displayMessage('Veuillez sélectionner un étudiant.', true);
                return;
            }
            const type = typeSelect.value;
            const encodingData = {
                id_etudiant:  idStudent,
                type_passage: type,
                date:  document.getElementById('encoding-date').value  || new Date().toISOString().split('T')[0],
                heure: document.getElementById('encoding-time').value  || new Date().toTimeString().split(' ')[0],
                statut: type === 'Sortie midi' || type === 'Rentrée midi' || type === 'Sortie autorisée'
                    ? 'Autorisé'
                    : 'Présent', // sera recalculé côté serveur pour Entrée matin
            };
            this.controller.addEncoding(encodingData);
        });

        // --- Afficher/masquer la raison ---
        typeSelect.addEventListener('change', () => {
            reasonSelect.style.display = typeSelect.value === 'Sortie autorisée' ? 'block' : 'none';
        });
    }

    _clearStudentSelection() {
        document.getElementById('encoding-id-student').value = '';
        const infoDiv = document.getElementById('encoding-student-info');
        if (infoDiv) { infoDiv.textContent = ''; infoDiv.style.display = 'none'; }
        const addBtn = document.getElementById('btn-add-encoding');
        if (addBtn) addBtn.disabled = true;
    }

    clearForm() {
        document.getElementById('encoding-classe').value = '';
        document.getElementById('encoding-name-student').innerHTML = '<option value="">-- Nom --</option>';
        document.getElementById('encoding-name-student').disabled = true;
        document.getElementById('encoding-surname-student').innerHTML = '<option value="">-- Prénom --</option>';
        document.getElementById('encoding-surname-student').disabled = true;
        document.getElementById('encoding-type').value = 'Entrée matin';
        document.getElementById('encoding-reason').style.display = 'none';
        document.getElementById('encoding-reason').value = '';
        this._clearStudentSelection();
        this._setCurrentDateTimeDefaults();
    }

    displayMessage(message, isError = false) {
        const messageDiv = document.getElementById('encoding-message');
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? 'red' : 'green';
        setTimeout(() => { messageDiv.textContent = ''; }, 3000);
    }
}
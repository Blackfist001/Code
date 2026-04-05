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
            })
            .catch(error => console.error('Error loading manual encoding:', error));
    }

    // Charge la liste des classes depuis l'API et alimente le select
    async _loadClasses() {
        try {
            const response = await api.getAllStudents();
            const students = response.success ? response.results ?? response : response;
            const classes = [...new Set((Array.isArray(students) ? students : []).map(s => s.classe).filter(Boolean))].sort();
            this._students = Array.isArray(students) ? students : [];

            const classeSelect = document.getElementById('encoding-classe');
            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
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
            const classe = classeSelect.value;
            this._clearStudentSelection();

            // Reset selects
            nomSelect.innerHTML = '<option value="">-- Nom --</option>';
            prenomSelect.innerHTML = '<option value="">-- Prénom --</option>';
            nomSelect.disabled = true;
            prenomSelect.disabled = true;

            if (!classe) return;

            const noms = [...new Set(
                (this._students || []).filter(s => s.classe === classe).map(s => s.nom)
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
            const classe = classeSelect.value;
            const nom    = nomSelect.value;
            this._clearStudentSelection();

            prenomSelect.innerHTML = '<option value="">-- Prénom --</option>';
            prenomSelect.disabled = true;

            if (!nom) return;

            const etudiants = (this._students || []).filter(s => s.classe === classe && s.nom === nom);
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
                statut: type === 'sortie_midi' || type === 'retour_midi' || type === 'sortie_autorisee'
                    ? 'autorise'
                    : 'present', // sera recalculé côté serveur pour entree_matin
            };
            this.controller.addEncoding(encodingData);
        });

        // --- Afficher/masquer la raison ---
        typeSelect.addEventListener('change', () => {
            reasonSelect.style.display = typeSelect.value === 'sortie_autorisee' ? 'block' : 'none';
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
        document.getElementById('encoding-type').value = 'entree_matin';
        document.getElementById('encoding-date').value = '';
        document.getElementById('encoding-time').value = '';
        document.getElementById('encoding-reason').style.display = 'none';
        document.getElementById('encoding-reason').value = '';
        this._clearStudentSelection();
    }

    displayMessage(message, isError = false) {
        const messageDiv = document.getElementById('encoding-message');
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? 'red' : 'green';
        setTimeout(() => { messageDiv.textContent = ''; }, 3000);
    }
}
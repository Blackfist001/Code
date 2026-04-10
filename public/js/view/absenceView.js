import api from '../api.js';

export default class AbsenceView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
    }

    setController(controller) {
        this.controller = controller;
    }

    async render() {
        try {
            const response = await fetch('html/absence.html');
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const data = await response.text();
            this.container.innerHTML = data;
            this._loadStudents();
            this.attachEventListeners();
        } catch (error) {
            console.error('Erreur rendu page absents:', error);
            this.container.innerHTML = '<div class="card"><p>Impossible de charger la page des absents.</p></div>';
        }
    }

    async _loadStudents() {
        try {
            const response = await api.getAllStudents();
            this._students = response.success ? (response.results ?? []) : [];

            const classes = [...new Set(this._students.map(s => s.classe).filter(Boolean))].sort();
            const classeSelect = document.getElementById('absent-classe');
            if (!classeSelect) return;

            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                classeSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Erreur chargement étudiants:', e);
        }
    }

    displayAbsents(absents = []) {
        const tbody = document.getElementById('absents-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!absents || absents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Aucun absent enregistré</td></tr>';
            return;
        }
        
        absents.forEach(absent => {
            const statusLabel = absent.statut || 'Absent';
            const badgeClass = statusLabel === 'Absent'
                ? 'status-refuse'
                : 'status-info';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${absent.date_passage || '---'}</td>
                <td>${absent.nom || '---'}</td>
                <td>${absent.prenom || '---'}</td>
                <td>${absent.classe || '---'}</td>
                <td>${absent.type_passage || '---'}</td>
                <td><span class="status-badge ${badgeClass}">${statusLabel}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    attachEventListeners() {
        const classeSelect  = document.getElementById('absent-classe');
        const nomSelect     = document.getElementById('absent-name');
        const prenomSelect  = document.getElementById('absent-surname');
        const addAbsentBtn  = document.getElementById('btn-add-absent');

        // --- Cascade classe → nom ---
        if (classeSelect) {
            classeSelect.addEventListener('change', () => {
                const classe = classeSelect.value;
                this._clearStudentSelection();
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
        }

        // --- Cascade nom → prénom ---
        if (nomSelect) {
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

                if (etudiants.length === 1) {
                    prenomSelect.value = etudiants[0].id_etudiant;
                    prenomSelect.dispatchEvent(new Event('change'));
                }
            });
        }

        // --- Prénom → sélectionne étudiant ---
        if (prenomSelect) {
            prenomSelect.addEventListener('change', () => {
                const studentId = prenomSelect.value;
                if (!studentId) { this._clearStudentSelection(); return; }
                document.getElementById('absent-student-id').value = studentId;
                if (addAbsentBtn) addAbsentBtn.disabled = false;
            });
        }

        // --- Bouton Ajouter ---
        if (addAbsentBtn && this.controller) {
            addAbsentBtn.addEventListener('click', () => {
                const studentId = document.getElementById('absent-student-id').value;
                const reason    = document.getElementById('absent-reason').value;
                if (studentId) {
                    this.controller.markAbsent(studentId, reason);
                }
            });
        }
    }

    _clearStudentSelection() {
        document.getElementById('absent-student-id').value = '';
        const btn = document.getElementById('btn-add-absent');
        if (btn) btn.disabled = true;
    }
}
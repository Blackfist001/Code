import api from '../api.js';

export default class SearchView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/search.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this._loadStudents();
                this.attachSearchHandler();
            })
            .catch(error => console.error('Error loading search:', error));
    }

    async _loadStudents() {
        try {
            const response = await api.getAllStudents();
            this._students = response.success ? (response.results ?? []) : [];

            const classes = [...new Set(this._students.map(s => s.classe).filter(Boolean))].sort();
            const classeSelect = document.getElementById('search-classe');
            if (!classeSelect) return;

            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                classeSelect.appendChild(opt);
            });

            // Populate nom with all students initially
            this._populateNomSelect(this._students);

            // Cascade: classe → nom → prénom
            classeSelect.addEventListener('change', () => {
                const classe = classeSelect.value;
                const filtered = classe
                    ? this._students.filter(s => s.classe === classe)
                    : this._students;
                this._populateNomSelect(filtered);
                this._populatePrenomSelect([]);
            });

            const nomSelect = document.getElementById('search-name');
            if (nomSelect) {
                nomSelect.addEventListener('change', () => {
                    const classe = classeSelect.value;
                    const nom    = nomSelect.value;
                    const filtered = this._students.filter(s =>
                        (!classe || s.classe === classe) && (!nom || s.nom === nom)
                    );
                    this._populatePrenomSelect(filtered);
                });
            }
        } catch (e) {
            console.error('Erreur chargement étudiants:', e);
        }
    }

    _populateNomSelect(students) {
        const nomSelect = document.getElementById('search-name');
        if (!nomSelect) return;
        const noms = [...new Set(students.map(s => s.nom).filter(Boolean))].sort();
        nomSelect.innerHTML = '<option value="">Tous les noms</option>';
        noms.forEach(nom => {
            const opt = document.createElement('option');
            opt.value = nom;
            opt.textContent = nom;
            nomSelect.appendChild(opt);
        });
        // Reset prénom when nom list changes
        this._populatePrenomSelect([]);
    }

    _populatePrenomSelect(students) {
        const prenomSelect = document.getElementById('search-surname');
        if (!prenomSelect) return;
        const prenoms = [...new Set(students.map(s => s.prenom).filter(Boolean))].sort();
        prenomSelect.innerHTML = '<option value="">Tous les prénoms</option>';
        prenoms.forEach(prenom => {
            const opt = document.createElement('option');
            opt.value = prenom;
            opt.textContent = prenom;
            prenomSelect.appendChild(opt);
        });
    }

    attachSearchHandler() {
        const searchButton = document.getElementById('btn-search');
        const resetButton = document.getElementById('btn-reset');
        
        if(searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.controller.searchStudent();
            });
        }
        
        if(resetButton) {
            resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.controller.resetSearch();
            });
        }

    }

    resetSelects() {
        const classeSelect  = document.getElementById('search-classe');
        const nomSelect     = document.getElementById('search-name');
        const prenomSelect  = document.getElementById('search-surname');
        if (classeSelect)  classeSelect.value = '';
        if (nomSelect)     { this._populateNomSelect(this._students || []); }
        if (prenomSelect)  { this._populatePrenomSelect([]); }
    }

    displayResults(results) {
        const tbody = document.getElementById('search-results-body');
        const messageDiv = document.getElementById('search-message');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (!results || results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Aucun résultat trouvé</td></tr>';
            if (messageDiv) messageDiv.textContent = 'Aucun passage trouvé';
            return;
        }

        const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
        const STATUT_VERT  = ['Présent', 'Autorisé'];

        results.forEach(passage => {
            const statut = passage.statut || '---';
            const statutClass = STATUT_ROUGE.includes(statut)
                ? 'status-refuse'
                : STATUT_VERT.includes(statut)
                    ? 'status-present'
                    : '';
            const totalDemiJournees = Number(passage.total_demi_journees) || 0;
            const demiJourneeClass = totalDemiJournees >= 9 ? 'demi-journee-critical' : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${passage.date_passage || '---'}</td>
                <td>${passage.heure_passage || '---'}</td>
                <td>${passage.nom || '---'}</td>
                <td>${passage.prenom || '---'}</td>
                <td>${passage.classe || '---'}</td>
                <td><span class="${demiJourneeClass}">${totalDemiJournees}</span></td>
                <td>${passage.type_passage || '---'}</td>
                <td><span class="status-badge ${statutClass}">${statut}</span></td>
            `;
            tbody.appendChild(row);
        });

        if (messageDiv) messageDiv.textContent = `${results.length} passage(s) trouvé(s)`;
    }

    clearMessage() {
        const messageDiv = document.getElementById('search-message');
        if (messageDiv) {
            messageDiv.textContent = '';
        }
    }
}
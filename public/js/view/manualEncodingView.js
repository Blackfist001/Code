import api from '../api.js';

/**
 * Vue de la page d'encodage manuel.
 * Permet de saisir manuellement un passage pour un étudiant via des listes déroulantes cascadées
 * (classe → nom → prénom) et affiche l'historique des encodages manuels.
 */
export default class ManualEncodingView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    /**
     * Charge le HTML de la page encodage manuel et initialise les écouteurs.
     */
    render() {
        fetch('html/manualEncoding.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this._loadClasses();
                this._loadReasonOptions();
                this.attachEventListeners();
                this._setCurrentDateTimeDefaults();
                this.refreshHistory();
            })
            .catch(error => console.error('Error loading manual encoding:', error));
    }

    /**
     * Charge les options de raison depuis l'API et alimente les menus déroulants.
     * @returns {Promise<void>}
     */
    async _loadReasonOptions() {
        const reasonSelect = document.getElementById('encoding-reason');
        const filterReasonSelect = document.getElementById('encoding-filter-raison');
        if (!reasonSelect && !filterReasonSelect) return;

        const renderReasonOptions = (reasons) => {
            if (reasonSelect) {
                reasonSelect.innerHTML = '<option value="">-- Raison --</option>';
                reasons.forEach(reason => {
                    const opt = document.createElement('option');
                    opt.value = reason;
                    opt.textContent = reason;
                    reasonSelect.appendChild(opt);
                });
            }

            if (filterReasonSelect) {
                filterReasonSelect.innerHTML = '<option value="">Toutes les raisons</option>';
                reasons.forEach(reason => {
                    const opt = document.createElement('option');
                    opt.value = reason;
                    opt.textContent = reason;
                    filterReasonSelect.appendChild(opt);
                });
            }
        };

        try {
            const response = await api.getMovementReasonOptions();
            const reasons = response?.success ? (response.results || []) : [];
            renderReasonOptions(reasons);
        } catch (e) {
            renderReasonOptions(['Certificat médical', 'Autorisation  des parents', 'Autre']);
        }
    }

    /**
     * Pré-remplit les champs date et heure avec la valeur courante.
     */
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

    /**
     * Recharge et affiche l'historique des encodages manuels (15 derniers, filtrés).
     * @returns {Promise<void>}
     */
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

            const filterType = (document.getElementById('encoding-filter-type')?.value || '').trim();
            const filterStatut = (document.getElementById('encoding-filter-statut')?.value || '').trim();
            const filterRaison = (document.getElementById('encoding-filter-raison')?.value || '').trim();

            const filteredMovements = manualMovements.filter(movement => {
                const typeMatch = !filterType || (movement.type_passage || '') === filterType;
                const statutMatch = !filterStatut || (movement.statut || '') === filterStatut;
                const movementRaison = (movement.raison || movement.reason || '').trim();
                const raisonMatch = !filterRaison || movementRaison === filterRaison;
                return typeMatch && statutMatch && raisonMatch;
            });

            tbody.innerHTML = '';

            if (!filteredMovements.length) {
                tbody.innerHTML = '<tr><td colspan="7">Aucun encodage manuel enregistré</td></tr>';
                return;
            }

            const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
            const STATUT_VERT = ['Présent', 'Autorisé'];

            filteredMovements.slice(0, 15).forEach(movement => {
                const statut = movement.statut || '---';
                const statutClass = STATUT_ROUGE.includes(statut)
                    ? 'status-refuse'
                    : STATUT_VERT.includes(statut)
                        ? 'status-present'
                        : 'status-info';
                const typeLabel = movement.type_passage || '---';
                const typeClass = 'status-info';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${movement.date_passage || '---'}</td>
                    <td>${movement.heure_passage || '---'}</td>
                    <td>${movement.nom || '---'}</td>
                    <td>${movement.prenom || '---'}</td>
                    <td><span class="status-badge ${typeClass}">${typeLabel}</span></td>
                    <td><span class="status-badge ${statutClass}">${statut}</span></td>
                    <td>${movement.raison || movement.reason || '---'}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="7">Erreur lors du chargement de l\'historique</td></tr>';
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

    /**
     * Branche tous les écouteurs du formulaire (classe, nom, prénom, filtres, soumission).
     */
    attachEventListeners() {
        const classeSelect   = document.getElementById('encoding-classe');
        const nomSelect      = document.getElementById('encoding-name-student');
        const prenomSelect   = document.getElementById('encoding-surname-student');
        const addBtn         = document.getElementById('btn-add-encoding');
        const typeSelect     = document.getElementById('encoding-type');
        const statusSelect   = document.getElementById('encoding-status');
        const reasonSelect   = document.getElementById('encoding-reason');
        const filterTypeSelect = document.getElementById('encoding-filter-type');
        const filterStatutSelect = document.getElementById('encoding-filter-statut');
        const filterReasonSelect = document.getElementById('encoding-filter-raison');

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
                statut: statusSelect?.value || 'Présent',
                raison: reasonSelect && reasonSelect.style.display !== 'none'
                    ? (reasonSelect.value || null)
                    : null,
            };
            this.controller.addEncoding(encodingData);
        });

        const STATUTS_PAR_TYPE = {
            'Entrée matin': ['Présent', 'En retard'],
            'Rentrée midi': ['Présent', 'En retard'],
            'Entrée après-midi': ['Présent', 'En retard'],
            'Sortie midi': ['Autorisé', 'Refusé'],
            'Journée': ['Présent', 'Absent', 'Absence justifiée'],
            'Sortie autorisée': ['Autorisé'],
        };

        // --- Afficher/masquer raison + options statut selon le type ---
        const toggleTypeDependentFields = () => {
            const type = typeSelect.value;
            const statusOptions = STATUTS_PAR_TYPE[type] || ['Présent'];

            if (statusSelect) {
                const previousStatus = statusSelect.value;
                statusSelect.innerHTML = '';

                statusOptions.forEach(status => {
                    const opt = document.createElement('option');
                    opt.value = status;
                    opt.textContent = status;
                    statusSelect.appendChild(opt);
                });

                statusSelect.value = statusOptions.includes(previousStatus)
                    ? previousStatus
                    : statusOptions[0];
            }

            const showReason = type === 'Journée' && statusSelect?.value === 'Absence justifiée';
            reasonSelect.style.display = showReason ? 'block' : 'none';
            if (!showReason) {
                reasonSelect.value = '';
            }
        };

        typeSelect.addEventListener('change', () => {
            toggleTypeDependentFields();
        });
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                toggleTypeDependentFields();
            });
        }
        toggleTypeDependentFields();

        if (filterTypeSelect && filterStatutSelect) {
            const toggleStatutFilter = () => {
                const hideStatut = filterTypeSelect.value === 'Sortie autorisée';
                if (hideStatut) {
                    filterStatutSelect.value = '';
                    filterStatutSelect.style.display = 'none';
                } else {
                    filterStatutSelect.style.display = 'block';
                }
            };

            const toggleReasonFilter = () => {
                if (!filterReasonSelect) return;
                const type = filterTypeSelect.value;
                const statut = filterStatutSelect.value;
                const hideReason = (type === 'Sortie autorisée' || type === 'Sortie justifiée') && statut === 'Autorisé';
                if (hideReason) {
                    filterReasonSelect.value = '';
                    filterReasonSelect.style.display = 'none';
                } else {
                    filterReasonSelect.style.display = 'block';
                }
            };

            filterTypeSelect.addEventListener('change', async () => {
                toggleStatutFilter();
                toggleReasonFilter();
                await this.refreshHistory();
            });

            filterStatutSelect.addEventListener('change', async () => {
                toggleReasonFilter();
                await this.refreshHistory();
            });

            if (filterReasonSelect) {
                filterReasonSelect.addEventListener('change', async () => {
                    await this.refreshHistory();
                });
            }

            toggleStatutFilter();
            toggleReasonFilter();
        }
    }

    /**
     * Réinitialise les champs étudiant (id caché, info, bouton d'ajout).
     */
    _clearStudentSelection() {
        document.getElementById('encoding-id-student').value = '';
        const infoDiv = document.getElementById('encoding-student-info');
        if (infoDiv) { infoDiv.textContent = ''; infoDiv.style.display = 'none'; }
        const addBtn = document.getElementById('btn-add-encoding');
        if (addBtn) addBtn.disabled = true;
    }

    /**
     * Remet à zéro tous les champs du formulaire après un encodage réussi.
     */
    clearForm() {
        document.getElementById('encoding-classe').value = '';
        document.getElementById('encoding-name-student').innerHTML = '<option value="">-- Nom --</option>';
        document.getElementById('encoding-name-student').disabled = true;
        document.getElementById('encoding-surname-student').innerHTML = '<option value="">-- Prénom --</option>';
        document.getElementById('encoding-surname-student').disabled = true;
        document.getElementById('encoding-type').value = 'Entrée matin';
        const statusSelect = document.getElementById('encoding-status');
        if (statusSelect) {
            statusSelect.innerHTML = '';
            ['Présent', 'En retard'].forEach(status => {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                statusSelect.appendChild(opt);
            });
            statusSelect.value = 'Présent';
        }
        document.getElementById('encoding-reason').style.display = 'none';
        document.getElementById('encoding-reason').value = '';
        this._clearStudentSelection();
        this._setCurrentDateTimeDefaults();
    }

    /**
     * Affiche un message de résultat (succès ou erreur) dans la zone dédiée.
     * @param {string} message       - Texte du message
     * @param {boolean} [isError=false] - Si true, affiche en rouge
     */
    displayMessage(message, isError = false) {
        const messageDiv = document.getElementById('encoding-message');
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? 'red' : 'green';
        setTimeout(() => { messageDiv.textContent = ''; }, 3000);
    }
}
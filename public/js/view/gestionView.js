export default class GestionView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        return fetch('html/gestion.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this._attachSidebarNav();
                this.attachEventListeners();
            })
            .catch(error => console.error('Error loading gestion:', error));
    }

    // ─── Navigation sidebar ────────────────────────────────────────────────

    _attachSidebarNav() {
        document.querySelectorAll('.gestion-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                document.querySelectorAll('.gestion-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                document.querySelectorAll('.gestion-section').forEach(s => s.style.display = 'none');
                document.getElementById(`section-${section}`).style.display = 'block';

                if (section === 'students')  this.controller.loadStudents();
                if (section === 'passages')  this.controller.loadPassages();
                if (section === 'schedules') this.controller.loadSchedules();
                if (section === 'users')     this.controller.loadUsers();
            });
        });
        // Charger la section active par défaut (passages)
        this.controller.loadPassages();
    }

    // ─── Utilisateurs ──────────────────────────────────────────────────────

    attachEventListeners() {
        const addUserBtn = document.getElementById('btn-add-user');
        if (addUserBtn && this.controller) {
            addUserBtn.addEventListener('click', () => {
                const username = document.getElementById('user-username').value;
                const password = document.getElementById('user-password').value;
                const role     = document.getElementById('user-role').value;
                if (username && password && role) {
                    this.controller.addUser({ username, password, role });
                    document.getElementById('user-username').value = '';
                    document.getElementById('user-password').value = '';
                    document.getElementById('user-role').value = '';
                }
            });
        }

        const filterBtn = document.getElementById('btn-filter-passages');
        if (filterBtn) filterBtn.addEventListener('click', () => {
            const date = document.getElementById('passages-filter-date').value;
            if (date) this.controller.loadPassagesByDate(date);
        });
        const allBtn = document.getElementById('btn-load-all-passages');
        if (allBtn) allBtn.addEventListener('click', () => this.controller.loadPassages());

        const addSchedBtn = document.getElementById('btn-add-schedule');
        if (addSchedBtn && this.controller) {
            addSchedBtn.addEventListener('click', () => {
                const data = {
                    nom_classe:   document.getElementById('sched-classe').value.trim(),
                    matiere:      document.getElementById('sched-matiere').value.trim(),
                    jour_semaine: document.getElementById('sched-jour').value,
                    heure_debut:  document.getElementById('sched-debut').value,
                    heure_fin:    document.getElementById('sched-fin').value,
                    salle:        document.getElementById('sched-salle').value.trim(),
                };
                if (!data.nom_classe || !data.matiere || !data.jour_semaine || !data.heure_debut || !data.heure_fin) {
                    alert('Veuillez remplir tous les champs obligatoires.');
                    return;
                }
                this.controller.addSchedule(data);
                ['sched-classe','sched-matiere','sched-jour','sched-debut','sched-fin','sched-salle']
                    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            });
        }
    }

    displayUsers(users = []) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Aucun utilisateur</td></tr>';
            return;
        }

        users.forEach(user => {
            const id       = user.id || user.id_user || '';
            const username = user.username || user.nom || '';
            const role     = user.role || '';
            const isAdmin  = username.toLowerCase() === 'admin';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${id}</td>
                <td>${username}</td>
                <td>${role}</td>
                <td>
                    <button class="btn-edit-user" data-id="${id}" data-username="${username}" data-role="${role}">Modifier</button>
                    ${isAdmin
                        ? '<button disabled title="L\'utilisateur admin ne peut pas être supprimé" style="opacity:0.4;cursor:not-allowed;">Supprimer</button>'
                        : `<button class="btn-delete-user" data-id="${id}">Supprimer</button>`
                    }
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', () => this.showEditUserModal(
                btn.dataset.id, btn.dataset.username, btn.dataset.role
            ));
        });
        tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cet utilisateur ?')) this.controller.deleteUser(btn.dataset.id);
            });
        });
    }

    showEditUserModal(userId, currentUsername, currentRole) {
        this._showModal(`
            <h3>Modifier l'utilisateur</h3>
            <div class="form-container">
                <input type="text" id="edit-user-username" value="${currentUsername}" placeholder="Nom d'utilisateur">
                <input type="password" id="edit-user-password" placeholder="Nouveau mot de passe (laisser vide)">
                <select id="edit-user-role">
                    <option value="surveillant" ${currentRole==='surveillant'?'selected':''}>Surveillant</option>
                    <option value="administration" ${currentRole==='administration'?'selected':''}>Administration</option>
                    <option value="administrateur" ${currentRole==='administrateur'?'selected':''}>Administrateur</option>
                </select>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);
        document.getElementById('modal-btn-save').addEventListener('click', () => {
            const username = document.getElementById('edit-user-username').value;
            const password = document.getElementById('edit-user-password').value;
            const role     = document.getElementById('edit-user-role').value;
            if (username && role) {
                this.controller.updateUser(userId, { username, password, role });
                this._hideModal();
            }
        });
        document.getElementById('modal-btn-cancel').addEventListener('click', () => this._hideModal());
    }

    // ─── Étudiants ─────────────────────────────────────────────────────────

    displayStudents(students = []) {
        const tbody = document.getElementById('students-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!students.length) {
            tbody.innerHTML = '<tr><td colspan="6">Aucun étudiant</td></tr>';
            return;
        }

        students.forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.nom || '---'}</td>
                <td>${s.prenom || '---'}</td>
                <td>${s.classe || '---'}</td>
                <td>${s.date_naissance || '---'}</td>
                <td>${s.autorisation_midi == 1 ? '✓' : '✗'}</td>
                <td>
                    <button class="btn-edit-student" data-id="${s.id_etudiant}">Modifier</button>
                    <button class="btn-delete-student" data-id="${s.id_etudiant}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-student').forEach(btn => {
            btn.addEventListener('click', () => {
                const student = students.find(s => String(s.id_etudiant) === btn.dataset.id);
                if (student) this.showEditStudentModal(student);
            });
        });
        tbody.querySelectorAll('.btn-delete-student').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cet étudiant ? Ses passages seront également supprimés.'))
                    this.controller.deleteStudent(btn.dataset.id);
            });
        });
    }

    showEditStudentModal(student) {
        this._showModal(`
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
            this.controller.updateStudent(student.id_etudiant, {
                nom:              document.getElementById('edit-nom').value,
                prenom:           document.getElementById('edit-prenom').value,
                classe:           document.getElementById('edit-classe').value,
                date_naissance:   document.getElementById('edit-naissance').value,
                autorisation_midi: document.getElementById('edit-midi').checked ? 1 : 0,
            });
            this._hideModal();
        });
        document.getElementById('modal-btn-cancel').addEventListener('click', () => this._hideModal());
    }

    // ─── Passages ──────────────────────────────────────────────────────────

    displayPassages(passages = []) {
        const tbody = document.getElementById('passages-gestion-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!passages.length) {
            tbody.innerHTML = '<tr><td colspan="8">Aucun passage</td></tr>';
            return;
        }

        const STATUT_ROUGE = ['absent', 'refuse', 'en_retard'];
        const STATUT_VERT  = ['present', 'autorise'];
        const statutLabels = { present:'Présent', autorise:'Autorisé', refuse:'Refusé', absent:'Absent', en_retard:'En retard', absence_justifie:'Absence justifiée', sortie_justifie:'Sortie justifiée' };
        const typeLabels   = { entree_matin:'Entrée matin', sortie_midi:'Sortie midi', retour_midi:'Retour midi', sortie_autorisee:'Sortie autorisée' };

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
                <td>${typeLabels[p.type_passage] ?? p.type_passage ?? '---'}</td>
                <td><span class="status-badge ${sc}">${statutLabels[statut] ?? statut}</span></td>
                <td>
                    <button class="btn-edit-passage" data-id="${p.id_passage}">Modifier</button>
                    <button class="btn-delete-passage" data-id="${p.id_passage}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-passage').forEach(btn => {
            btn.addEventListener('click', () => {
                const passage = passages.find(p => String(p.id_passage) === btn.dataset.id);
                if (passage) this.showEditPassageModal(passage);
            });
        });
        tbody.querySelectorAll('.btn-delete-passage').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer ce passage ?')) this.controller.deletePassage(btn.dataset.id);
            });
        });
    }

    showEditPassageModal(passage) {
        this._showModal(`
            <h3>Modifier le passage</h3>
            <div class="form-container">
                <label>Date</label>
                <input type="date" id="edit-date" value="${passage.date_passage || ''}">
                <label>Heure</label>
                <input type="time" id="edit-heure" value="${(passage.heure_passage||'').substring(0,5)}">
                <label>Type</label>
                <select id="edit-type">
                    <option value="entree_matin" ${passage.type_passage==='entree_matin'?'selected':''}>Entrée matin</option>
                    <option value="sortie_midi" ${passage.type_passage==='sortie_midi'?'selected':''}>Sortie midi</option>
                    <option value="retour_midi" ${passage.type_passage==='retour_midi'?'selected':''}>Retour midi</option>
                    <option value="sortie_autorisee" ${passage.type_passage==='sortie_autorisee'?'selected':''}>Sortie autorisée</option>
                </select>
                <label>Statut</label>
                <select id="edit-statut">
                    <option value="present" ${passage.statut==='present'?'selected':''}>Présent</option>
                    <option value="autorise" ${passage.statut==='autorise'?'selected':''}>Autorisé</option>
                    <option value="en_retard" ${passage.statut==='en_retard'?'selected':''}>En retard</option>
                    <option value="absent" ${passage.statut==='absent'?'selected':''}>Absent</option>
                    <option value="refuse" ${passage.statut==='refuse'?'selected':''}>Refusé</option>
                    <option value="absence_justifie" ${passage.statut==='absence_justifie'?'selected':''}>Absence justifiée</option>
                    <option value="sortie_justifie" ${passage.statut==='sortie_justifie'?'selected':''}>Sortie justifiée</option>
                </select>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);
        document.getElementById('modal-btn-save').addEventListener('click', () => {
            this.controller.updatePassage(passage.id_passage, {
                date_passage:  document.getElementById('edit-date').value,
                heure_passage: document.getElementById('edit-heure').value,
                type_passage:  document.getElementById('edit-type').value,
                statut:        document.getElementById('edit-statut').value,
            });
            this._hideModal();
        });
        document.getElementById('modal-btn-cancel').addEventListener('click', () => this._hideModal());
    }

    // ─── Modal générique ───────────────────────────────────────────────────

    // ─── Horaires ─────────────────────────────────────────────────────────

    displaySchedules(schedules = []) {
        const tbody = document.getElementById('schedules-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!schedules.length) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun horaire</td></tr>';
            return;
        }

        const jourLabels = { lundi:'Lundi', mardi:'Mardi', mercredi:'Mercredi', jeudi:'Jeudi', vendredi:'Vendredi', samedi:'Samedi' };

        schedules.forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.nom_classe || '---'}</td>
                <td>${s.matiere || '---'}</td>
                <td>${jourLabels[s.jour_semaine] ?? s.jour_semaine ?? '---'}</td>
                <td>${(s.heure_debut || '---').substring(0, 5)}</td>
                <td>${(s.heure_fin  || '---').substring(0, 5)}</td>
                <td>${s.salle || '---'}</td>
                <td>
                    <button class="btn-edit-schedule" data-id="${s.id}">Modifier</button>
                    <button class="btn-delete-schedule" data-id="${s.id}">Supprimer</button>
                </td>`;
            tbody.appendChild(row);
        });

        tbody.querySelectorAll('.btn-edit-schedule').forEach(btn => {
            btn.addEventListener('click', () => {
                const schedule = schedules.find(s => String(s.id) === btn.dataset.id);
                if (schedule) this.showEditScheduleModal(schedule);
            });
        });
        tbody.querySelectorAll('.btn-delete-schedule').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cet horaire ?')) this.controller.deleteSchedule(btn.dataset.id);
            });
        });
    }

    showEditScheduleModal(s) {
        this._showModal(`
            <h3>Modifier l'horaire</h3>
            <div class="form-container">
                <input type="text" id="edit-sched-classe" value="${s.nom_classe || ''}" placeholder="Classe">
                <input type="text" id="edit-sched-matiere" value="${s.matiere || ''}" placeholder="Matière">
                <select id="edit-sched-jour">
                    <option value="lundi"    ${s.jour_semaine==='lundi'   ?'selected':''}>Lundi</option>
                    <option value="mardi"    ${s.jour_semaine==='mardi'   ?'selected':''}>Mardi</option>
                    <option value="mercredi" ${s.jour_semaine==='mercredi'?'selected':''}>Mercredi</option>
                    <option value="jeudi"    ${s.jour_semaine==='jeudi'   ?'selected':''}>Jeudi</option>
                    <option value="vendredi" ${s.jour_semaine==='vendredi'?'selected':''}>Vendredi</option>
                    <option value="samedi"   ${s.jour_semaine==='samedi'  ?'selected':''}>Samedi</option>
                </select>
                <input type="time" id="edit-sched-debut" value="${(s.heure_debut||'').substring(0,5)}">
                <input type="time" id="edit-sched-fin"   value="${(s.heure_fin  ||'').substring(0,5)}">
                <input type="text" id="edit-sched-salle" value="${s.salle || ''}" placeholder="Salle">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="modal-btn-save">Enregistrer</button>
                    <button id="modal-btn-cancel">Annuler</button>
                </div>
            </div>
        `);
        document.getElementById('modal-btn-save').addEventListener('click', () => {
            this.controller.updateSchedule(s.id, {
                nom_classe:   document.getElementById('edit-sched-classe').value,
                matiere:      document.getElementById('edit-sched-matiere').value,
                jour_semaine: document.getElementById('edit-sched-jour').value,
                heure_debut:  document.getElementById('edit-sched-debut').value,
                heure_fin:    document.getElementById('edit-sched-fin').value,
                salle:        document.getElementById('edit-sched-salle').value,
            });
            this._hideModal();
        });
        document.getElementById('modal-btn-cancel').addEventListener('click', () => this._hideModal());
    }

    // ─── Modal générique (réel) ────────────────────────────────────────────

    _showModal(html) {
        const modal = document.getElementById('gestion-modal');
        const content = document.getElementById('gestion-modal-content');
        content.innerHTML = html;
        modal.style.display = 'block';
        modal.addEventListener('click', e => { if (e.target === modal) this._hideModal(); }, { once: true });
    }

    _hideModal() {
        const modal = document.getElementById('gestion-modal');
        if (modal) modal.style.display = 'none';
    }
}
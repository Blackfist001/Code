import ManagementUsersView from './management/managementUsersView.js';
import ManagementStudentsView from './management/managementStudentsView.js';
import ManagementPassagesView from './management/managementPassagesView.js';
import ManagementSettingsView from './management/managementSettingsView.js';
import ManagementPassageTypesView from './management/managementPassageTypesView.js';
import ManagementQrCodesView from './management/managementQrCodesView.js';
import ManagementSchedulesView from './management/managementSchedulesView.js';
import ManagementSlotsView from './management/managementSlotsView.js';
import ManagementClassesView from './management/managementClassesView.js';
import ManagementClassroomView from './management/managementClassroomView.js';
import ManagementMatieresView from './management/managementMatieresView.js';
import ManagementTeachersView from './management/managementTeachersView.js';
import ManagementAuditsView from './management/managementAuditsView.js';

/**
 * Vue principale de la page de gestion.
 * Orchestre l'affichage des sections (passages, étudiants, utilisateurs, horaires, classes, matières, QR codes)
 * via les sous-vues spécialisées et expose des helpers partagés (options classes, matières, créneaux, modales).
 */
export default class ManagementView {
    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');

        this._creneauxDebut = [];
        this._creneauxFin = [];
        this._classes = [];
        this._classrooms = [];
        this._matieres = [];
        this._teachers = [];

        this.usersView = new ManagementUsersView(this);
        this.studentsView = new ManagementStudentsView(this);
        this.passagesView = new ManagementPassagesView(this);
        this.settingsView = new ManagementSettingsView(this);
        this.passageTypesView = new ManagementPassageTypesView(this);
        this.qrCodesView = new ManagementQrCodesView(this);
        this.schedulesView = new ManagementSchedulesView(this);
        this.slotsView = new ManagementSlotsView(this);
        this.classesView = new ManagementClassesView(this);
        this.classroomView = new ManagementClassroomView(this);
        this.matieresView = new ManagementMatieresView(this);
        this.teachersView = new ManagementTeachersView(this);
        this.auditsView = new ManagementAuditsView(this);
    }

    /**
     * Tronque une valeur de temps HH:MM:SS à HH:MM.
     * @param {string} value
     * @returns {string}
     */
    _toHHMM(value) {
        return String(value || '').substring(0, 5);
    }

    /**
     * Génère les balises `<option>` HTML pour la liste de créneaux de début.
     * @param {number|string} [selectedId=''] - ID du créneau à pré-sélectionner
     * @param {boolean} [includePlaceholder=true] - Inclure un placeholder vide
     * @returns {string} HTML des options
     */
    _renderCreneauDebutOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Créneau début --</option>');
        }

        (this._creneauxDebut || []).forEach(c => {
            const id = String(c.id_creneau);
            const isSelected = String(selectedId || '') === id ? ' selected' : '';
            options.push(`<option value="${id}"${isSelected}>${this._toHHMM(c.creneau)}</option>`);
        });

        return options.join('');
    }

    /**
     * Génère les balises `<option>` HTML pour la liste de créneaux de fin.
     * @param {number|string} [selectedId=''] - ID du créneau à pré-sélectionner
     * @param {boolean} [includePlaceholder=true] - Inclure un placeholder vide
     * @returns {string} HTML des options
     */
    _renderCreneauFinOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Créneau fin --</option>');
        }

        (this._creneauxFin || []).forEach(c => {
            const id = String(c.id_creneau);
            const isSelected = String(selectedId || '') === id ? ' selected' : '';
            options.push(`<option value="${id}"${isSelected}>${this._toHHMM(c.creneau)}</option>`);
        });

        return options.join('');
    }

    /**
     * Génère les balises `<option>` HTML pour la liste de classes.
     * @param {number|string} [selectedId=''] - ID de la classe à pré-sélectionner
     * @param {boolean} [includePlaceholder=true]
     * @returns {string} HTML des options
     */
    _renderClassOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Classe --</option>');
        }

        (this._classes || []).forEach(c => {
            const id = String(c.id_classe);
            const isSelected = String(selectedId || '') === id ? ' selected' : '';
            options.push(`<option value="${id}"${isSelected}>${c.classe}</option>`);
        });

        return options.join('');
    }

    /**
     * Genere les balises `<option>` HTML pour la liste de locaux.
     * @param {number|string} [selectedId=''] - ID du local a pre-selectionner
     * @param {boolean} [includePlaceholder=true]
     * @returns {string} HTML des options
     */
    _renderLocalOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Local --</option>');
        }

        (this._classrooms || []).forEach(c => {
            const id = String(c.id_local);
            const isSelected = String(selectedId || '') === id ? ' selected' : '';
            options.push(`<option value="${id}"${isSelected}>${c.local}</option>`);
        });

        return options.join('');
    }

    /**
     * Génère les balises `<option>` HTML pour la liste de matières.
     * @param {number|string} [selectedId=''] - ID de la matière à pré-sélectionner
     * @param {boolean} [includePlaceholder=true]
     * @returns {string} HTML des options
     */
    _renderMatiereOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Matière --</option>');
        }

        (this._matieres || []).forEach(m => {
            const id = String(m.id_matiere);
            const isSelected = String(selectedId || '') === id ? ' selected' : '';
            options.push(`<option value="${id}"${isSelected}>${m.matiere}</option>`);
        });

        return options.join('');
    }

    /**
     * Génère les balises `<option>` HTML pour la liste des professeurs.
     * @param {number|string} [selectedId=''] - ID du professeur à pré-sélectionner
     * @param {boolean} [includePlaceholder=true]
     * @returns {string} HTML des options
     */
    _renderTeacherOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Professeur --</option>');
        }

        (this._teachers || []).forEach(t => {
            const id = String(t.id_professeur);
            const isSelected = String(selectedId || '') === id ? ' selected' : '';
            const label = [t.nom, t.prenom].filter(Boolean).join(' ').trim() || t.username || '---';
            options.push(`<option value="${id}"${isSelected}>${label}</option>`);
        });

        return options.join('');
    }

    /**
     * Stocke la liste de classes et met à jour les sous-vues qui en dépendent.
     * @param {Array} [classes=[]] - Liste des classes
     */
    setScheduleClasses(classes = []) {
        this._classes = Array.isArray(classes) ? classes : [];
        this.schedulesView.updateClassOptions();
        this.studentsView.updateClassOptions();
        this.passagesView.updateClassOptions();
        this.qrCodesView.updateClassOptions();
    }

    /**
     * Stocke la liste de matières et met à jour les sous-vues qui en dépendent.
     * @param {Array} [matieres=[]] - Liste des matières
     */
    setScheduleMatieres(matieres = []) {
        this._matieres = Array.isArray(matieres) ? matieres : [];
        this.schedulesView.updateMatiereOptions();
    }

    /**
     * Stocke la liste des professeurs et met à jour la sous-vue horaires.
     * @param {Array} [teachers=[]] - Liste des professeurs
     */
    setScheduleTeachers(teachers = []) {
        this._teachers = Array.isArray(teachers) ? teachers : [];
        this.schedulesView.updateTeacherOptions();
    }

    /**
     * Stocke la liste de locaux et met a jour la sous-vue horaires.
     * @param {Array} [classrooms=[]] - Liste des locaux
     */
    setScheduleClassrooms(classrooms = []) {
        this._classrooms = Array.isArray(classrooms) ? classrooms : [];
        this.schedulesView.updateLocalOptions();
    }

    /**
     * Stocke la liste des créneaux horaires début/fin et met à jour la sous-vue horaires.
     * @param {{debut?: Array, fin?: Array}} [creneaux={}] - Listes de créneaux
     */
    setScheduleSlots(creneaux = {}) {
        this._creneauxDebut = Array.isArray(creneaux?.debut) ? creneaux.debut : [];
        this._creneauxFin = Array.isArray(creneaux?.fin) ? creneaux.fin : [];
        this.schedulesView.updateSlotOptions();
        this.displaySlots();
    }

    /**
     * Transmet la liste des étudiants à la sous-vue passages (pour le formulaire d'ajout).
     * @param {Array} [students=[]] - Liste des étudiants
     */
    setPassageStudents(students = []) {
        this.passagesView.setPassageStudents(students);
    }

    /**
     * Charge en parallèle les partiels HTML de chaque section de gestion.
     * @returns {Promise<void>}
     */
    _loadSectionPartials() {
        const sections = Array.from(document.querySelectorAll('.gestion-section[data-partial]'));
        return Promise.all(sections.map(async section => {
            const partialPath = section.getAttribute('data-partial');
            if (!partialPath) return;

            const response = await fetch(`html/${partialPath}`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status} sur ${partialPath}`);
            }
            section.innerHTML = await response.text();
        }));
    }

    /**
     * Charge la page de gestion, affiche la section demandée et branche les écouteurs.
     * @param {string} [section='passages'] - Section à afficher en premier
     */
    render(section = 'passages') {
        return fetch('html/management.html', { cache: 'no-store' })
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                return this._loadSectionPartials();
            })
            .then(() => {
                this._activateSection(section);
                this.attachEventListeners();
            })
            .catch(error => console.error('Error loading management:', error));
    }

    /**
     * Affiche la section demandée et masque les autres; charge les données associées.
     * @param {string} section - Identifiant de section ('passages', 'students', 'users', ...)
     */
    _activateSection(section) {
        const validSections = ['passages', 'settings', 'type', 'students', 'qrcodes', 'schedules', 'slots', 'classes', 'classroom', 'matieres', 'teachers', 'audits', 'users'];
        const target = validSections.includes(section) ? section : 'passages';

        document.querySelectorAll('.gestion-section').forEach(s => {
            s.style.display = 'none';
        });

        const el = document.getElementById(`section-${target}`);
        if (el) el.style.display = 'block';

        if (target === 'students') this.controller.loadStudents();
        if (target === 'passages') this.controller.loadPassages();
        if (target === 'settings') this.controller.loadSettings();
        if (target === 'type') this.controller.loadPassageMetadata();
        if (target === 'qrcodes') this.controller.loadQrCodes();
        if (target === 'schedules') this.controller.loadSchedules();
        if (target === 'slots') this.controller.loadSlots();
        if (target === 'classes') this.controller.loadClasses();
        if (target === 'classroom') this.controller.loadClassrooms();
        if (target === 'matieres') this.controller.loadMatieres();
        if (target === 'teachers') this.controller.loadTeachers();
        if (target === 'audits') this.controller.loadAudits();
        if (target === 'users') this.controller.loadUsers();
    }

    /**
     * Retourne l'identifiant de la section de gestion visible.
     * Exemples: 'passages', 'qrcodes', 'schedules'.
     *
     * @returns {string}
     */
    getActiveSection() {
        const active = Array.from(document.querySelectorAll('.gestion-section'))
            .find((el) => el.style.display !== 'none');
        if (!active?.id) return '';
        return String(active.id).replace(/^section-/, '');
    }

    /**
     * Branche l'écouteur sur la navigation par onglets de la page de gestion.
     */
    attachEventListeners() {
        this.usersView.bindEvents(this.controller);
        this.studentsView.bindEvents(this.controller);
        this.passagesView.bindEvents(this.controller);
        this.settingsView.bindEvents(this.controller);
        this.passageTypesView.bindEvents(this.controller);
        this.qrCodesView.bindEvents(this.controller);
        this.schedulesView.bindEvents(this.controller);
        this.slotsView.bindEvents(this.controller);
        this.classesView.bindEvents(this.controller);
        this.classroomView.bindEvents(this.controller);
        this.matieresView.bindEvents(this.controller);
        this.teachersView.bindEvents(this.controller);
        this.auditsView.bindEvents(this.controller);
    }

    /**
     * Délègue l'affichage des utilisateurs à la sous-vue utilisateurs.
     * @param {Array} [users=[]] - Liste des utilisateurs
     */
    displayUsers(users = []) {
        this.usersView.displayUsers(this.controller, users);
    }

    /**
     * Délègue l'affichage des audits (connexions + changements DB).
     * @param {Array} [logins=[]]
     * @param {Array} [dbChanges=[]]
     */
    displayAudits(logins = [], dbChanges = []) {
        this.auditsView.displayAudits(logins, dbChanges);
    }

    /**
     * Délègue l'affichage des étudiants à la sous-vue étudiants.
     * @param {Array} [students=[]] - Liste des étudiants
     */
    displayStudents(students = []) {
        this.studentsView.displayStudents(this.controller, students);
    }

    /**
     * Délègue l'affichage des passages à la sous-vue passages.
     * @param {Array} [passages=[]] - Liste des passages
     */
    displayPassages(passages = []) {
        this.passagesView.displayPassages(this.controller, passages);
    }

    displaySettings(settings = {}, backups = [], slots = { debut: [], fin: [] }) {
        this.settingsView.displaySettings(settings, backups, slots);
    }

    displayPassageMetadata(payload = {}) {
        this.passageTypesView.displayPassageMetadata(this.controller, payload);
    }

    /**
     * Délègue l'affichage des QR codes étudiants à la sous-vue QR codes.
     * @param {Array} [students=[]] - Liste des étudiants
     */
    displayQrCodesStudents(students = []) {
        this.qrCodesView.displayStudents(this.controller, students);
    }

    /**
     * Délègue l'affichage des horaires à la sous-vue horaires.
     * @param {Array} [schedules=[]] - Liste des horaires
     */
    displaySchedules(schedules = []) {
        this.schedulesView.displaySchedules(this.controller, schedules);
    }

    /**
     * Délègue l'affichage des créneaux à la sous-vue créneaux.
     */
    displaySlots() {
        this.slotsView.displaySlots(this.controller);
    }

    /**
     * Délègue l'affichage des classes à la sous-vue classes.
     * @param {Array} [classes=[]] - Liste des classes
     */
    displayClasses(classes = []) {
        this.classesView.displayClasses(this.controller, classes);
    }

    /**
     * Delègue l'affichage des locaux à la sous-vue locaux.
     * @param {Array} [classrooms=[]] - Liste des locaux
     */
    displayClassrooms(classrooms = []) {
        this.classroomView.displayClassrooms(this.controller, classrooms);
    }

    /**
     * Délègue l'affichage des matières à la sous-vue matières.
     * @param {Array} [matieres=[]] - Liste des matières
     */
    displayMatieres(matieres = []) {
        this.matieresView.displayMatieres(this.controller, matieres);
    }

    /**
     * Délègue l'affichage des professeurs à la sous-vue professeurs.
     * @param {Array} [teachers=[]] - Liste des professeurs
     */
    displayTeachers(teachers = []) {
        this.teachersView.displayTeachers(this.controller, teachers);
    }

    /**
     * Injecte du HTML dans la modale centrale et l'affiche.
     * @param {string} html - Contenu HTML de la modale
     */
    _showModal(html) {
        const modal = document.getElementById('gestion-modal');
        const content = document.getElementById('gestion-modal-content');
        if (!modal || !content) return;

        content.innerHTML = html;
        modal.style.display = 'block';
        modal.addEventListener('click', e => {
            if (e.target === modal) this._hideModal();
        }, { once: true });
    }

    /**
     * Masque la modale centrale.
     */
    _hideModal() {
        const modal = document.getElementById('gestion-modal');
        if (modal) modal.style.display = 'none';
    }
}

import ManagementUsersView from './management/managementUsersView.js';
import ManagementStudentsView from './management/managementStudentsView.js';
import ManagementPassagesView from './management/managementPassagesView.js';
import ManagementQrCodesView from './management/managementQrCodesView.js';
import ManagementSchedulesView from './management/managementSchedulesView.js';
import ManagementClassesView from './management/managementClassesView.js';
import ManagementMatieresView from './management/managementMatieresView.js';

/**
 * Vue principale de la page de gestion.
 * Orchestre l'affichage des sections (passages, étudiants, utilisateurs, horaires, classes, matières, QR codes)
 * via les sous-vues spécialisées et expose des helpers partagés (options classes, matières, créneaux, modales).
 */
export default class ManagementView {
    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');

        this._creneaux = [];
        this._classes = [];
        this._matieres = [];

        this.usersView = new ManagementUsersView(this);
        this.studentsView = new ManagementStudentsView(this);
        this.passagesView = new ManagementPassagesView(this);
        this.qrCodesView = new ManagementQrCodesView(this);
        this.schedulesView = new ManagementSchedulesView(this);
        this.classesView = new ManagementClassesView(this);
        this.matieresView = new ManagementMatieresView(this);
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
     * Génère les balises `<option>` HTML pour la liste de créneaux horaires.
     * @param {number|string} [selectedId=''] - ID du créneau à pré-sélectionner
     * @param {boolean} [includePlaceholder=true] - Inclure un placeholder vide
     * @returns {string} HTML des options
     */
    _renderCreneauOptions(selectedId = '', includePlaceholder = true) {
        const options = [];
        if (includePlaceholder) {
            options.push('<option value="">-- Créneau --</option>');
        }

        (this._creneaux || []).forEach(c => {
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
     * Stocke la liste des créneaux horaires et met à jour la sous-vue horaires.
     * @param {Array} [creneaux=[]] - Liste des créneaux
     */
    setScheduleSlots(creneaux = []) {
        this._creneaux = Array.isArray(creneaux) ? creneaux : [];
        this.schedulesView.updateSlotOptions();
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

            const response = await fetch(`html/${partialPath}`);
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
        return fetch('html/management.html')
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
        const validSections = ['passages', 'students', 'qrcodes', 'schedules', 'classes', 'matieres', 'users'];
        const target = validSections.includes(section) ? section : 'passages';

        document.querySelectorAll('.gestion-section').forEach(s => {
            s.style.display = 'none';
        });

        const el = document.getElementById(`section-${target}`);
        if (el) el.style.display = 'block';

        if (target === 'students') this.controller.loadStudents();
        if (target === 'passages') this.controller.loadPassages();
        if (target === 'qrcodes') this.controller.loadQrCodes();
        if (target === 'schedules') this.controller.loadSchedules();
        if (target === 'classes') this.controller.loadClasses();
        if (target === 'matieres') this.controller.loadMatieres();
        if (target === 'users') this.controller.loadUsers();
    }

    /**
     * Branche l'écouteur sur la navigation par onglets de la page de gestion.
     */
    attachEventListeners() {
        this.usersView.bindEvents(this.controller);
        this.studentsView.bindEvents(this.controller);
        this.passagesView.bindEvents(this.controller);
        this.qrCodesView.bindEvents(this.controller);
        this.schedulesView.bindEvents(this.controller);
        this.classesView.bindEvents(this.controller);
        this.matieresView.bindEvents(this.controller);
    }

    /**
     * Délègue l'affichage des utilisateurs à la sous-vue utilisateurs.
     * @param {Array} [users=[]] - Liste des utilisateurs
     */
    displayUsers(users = []) {
        this.usersView.displayUsers(this.controller, users);
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
     * Délègue l'affichage des classes à la sous-vue classes.
     * @param {Array} [classes=[]] - Liste des classes
     */
    displayClasses(classes = []) {
        this.classesView.displayClasses(this.controller, classes);
    }

    /**
     * Délègue l'affichage des matières à la sous-vue matières.
     * @param {Array} [matieres=[]] - Liste des matières
     */
    displayMatieres(matieres = []) {
        this.matieresView.displayMatieres(this.controller, matieres);
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

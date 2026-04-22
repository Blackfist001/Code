import ManagementUsersView from './management/managementUsersView.js';
import ManagementStudentsView from './management/managementStudentsView.js';
import ManagementPassagesView from './management/managementPassagesView.js';
import ManagementQrCodesView from './management/managementQrCodesView.js';
import ManagementSchedulesView from './management/managementSchedulesView.js';
import ManagementClassesView from './management/managementClassesView.js';
import ManagementMatieresView from './management/managementMatieresView.js';

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

    _toHHMM(value) {
        return String(value || '').substring(0, 5);
    }

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

    setScheduleClasses(classes = []) {
        this._classes = Array.isArray(classes) ? classes : [];
        this.schedulesView.updateClassOptions();
        this.studentsView.updateClassOptions();
        this.passagesView.updateClassOptions();
        this.qrCodesView.updateClassOptions();
    }

    setScheduleMatieres(matieres = []) {
        this._matieres = Array.isArray(matieres) ? matieres : [];
        this.schedulesView.updateMatiereOptions();
    }

    setScheduleSlots(creneaux = []) {
        this._creneaux = Array.isArray(creneaux) ? creneaux : [];
        this.schedulesView.updateSlotOptions();
    }

    setPassageStudents(students = []) {
        this.passagesView.setPassageStudents(students);
    }

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

    attachEventListeners() {
        this.usersView.bindEvents(this.controller);
        this.studentsView.bindEvents(this.controller);
        this.passagesView.bindEvents(this.controller);
        this.qrCodesView.bindEvents(this.controller);
        this.schedulesView.bindEvents(this.controller);
        this.classesView.bindEvents(this.controller);
        this.matieresView.bindEvents(this.controller);
    }

    displayUsers(users = []) {
        this.usersView.displayUsers(this.controller, users);
    }

    displayStudents(students = []) {
        this.studentsView.displayStudents(this.controller, students);
    }

    displayPassages(passages = []) {
        this.passagesView.displayPassages(this.controller, passages);
    }

    displayQrCodesStudents(students = []) {
        this.qrCodesView.displayStudents(this.controller, students);
    }

    displaySchedules(schedules = []) {
        this.schedulesView.displaySchedules(this.controller, schedules);
    }

    displayClasses(classes = []) {
        this.classesView.displayClasses(this.controller, classes);
    }

    displayMatieres(matieres = []) {
        this.matieresView.displayMatieres(this.controller, matieres);
    }

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

    _hideModal() {
        const modal = document.getElementById('gestion-modal');
        if (modal) modal.style.display = 'none';
    }
}

import ManagementView from "../view/managementView.js";
import api from "../api.js";

import ManagementUsersController from "./management/managementUsersController.js";
import ManagementStudentsController from "./management/managementStudentsController.js";
import ManagementPassagesController from "./management/managementPassagesController.js";
import ManagementQrCodesController from "./management/managementQrCodesController.js";
import ManagementSchedulesController from "./management/managementSchedulesController.js";
import ManagementSlotsController from "./management/managementSlotsController.js";
import ManagementClassesController from "./management/managementClassesController.js";
import ManagementClassroomController from "./management/managementClassroomController.js";
import ManagementMatieresController from "./management/managementMatieresController.js";
import ManagementTeachersController from "./management/managementTeachersController.js";

/**
 * Contrôleur principal de la page de gestion.
 * Délègue chaque sous-domaine (utilisateurs, étudiants, passages, horaires, classes, matières, QR)
 * aux sous-contrôleurs dédiés et expose leurs méthodes publiques.
 */
export default class ManagementController {
    constructor() {
        this.view = new ManagementView(this);

        this.usersController = new ManagementUsersController(this, api);
        this.studentsController = new ManagementStudentsController(this, api);
        this.passagesController = new ManagementPassagesController(this, api);
        this.qrCodesController = new ManagementQrCodesController(this, api);
        this.schedulesController = new ManagementSchedulesController(this, api);
        this.slotsController = new ManagementSlotsController(this, api);
        this.classesController = new ManagementClassesController(this, api);
        this.classroomController = new ManagementClassroomController(this, api);
        this.matieresController = new ManagementMatieresController(this, api);
        this.teachersController = new ManagementTeachersController(this, api);

        // Garde les mêmes points d'entrée publics qu'avant pour éviter les régressions.
        const delegate = (methodName, sectionController) => {
            this[methodName] = sectionController[methodName].bind(sectionController);
        };

        ['loadUsers', 'addUser', 'updateUser', 'deleteUser'].forEach(m => delegate(m, this.usersController));

        ['loadStudents', 'loadPassageFormStudents', 'addStudent', 'updateStudent', 'deleteStudent']
            .forEach(m => delegate(m, this.studentsController));

        ['loadPassages', 'loadPassagesByDateRange', 'addPassage', 'exportPassagesCSV', 'updatePassage', 'deletePassage']
            .forEach(m => delegate(m, this.passagesController));

        ['loadQrCodes'].forEach(m => delegate(m, this.qrCodesController));

        ['loadScheduleOptions', 'refreshScheduleOptions', 'loadScheduleSlots', 'loadSchedules', 'addSchedule', 'updateSchedule', 'deleteSchedule', 'saveClassScheduleGrid']
            .forEach(m => delegate(m, this.schedulesController));

        ['loadSlots', 'addSlot', 'updateSlot', 'deleteSlot']
            .forEach(m => delegate(m, this.slotsController));

        ['loadClasses', 'addClass', 'updateClass', 'deleteClass'].forEach(m => delegate(m, this.classesController));
        ['loadClassrooms', 'addClassroom', 'updateClassroom', 'deleteClassroom'].forEach(m => delegate(m, this.classroomController));
        ['loadMatieres', 'addMatiere', 'updateMatiere', 'deleteMatiere'].forEach(m => delegate(m, this.matieresController));
        ['loadTeachers', 'addTeacher', 'updateTeacher', 'deleteTeacher']
            .forEach(m => delegate(m, this.teachersController));
    }

    /**
     * Charge la page de gestion pour une section donnée et initialise les listes dépendantes.
     * @param {string} [section='passages'] - Section à afficher initialement
     * @returns {Promise<void>}
     */
    async loadManagement(section = 'passages') {
        await this.view.render(section);
        await this.loadScheduleOptions();
        await this.loadPassageFormStudents();
        await this.loadScheduleSlots();
    }
}

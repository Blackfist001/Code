import ManagementView from "../view/managementView.js";
import api from "../api.js";

import ManagementUsersController from "./management/managementUsersController.js";
import ManagementStudentsController from "./management/managementStudentsController.js";
import ManagementPassagesController from "./management/managementPassagesController.js";
import ManagementQrCodesController from "./management/managementQrCodesController.js";
import ManagementSchedulesController from "./management/managementSchedulesController.js";
import ManagementClassesController from "./management/managementClassesController.js";
import ManagementMatieresController from "./management/managementMatieresController.js";

export default class ManagementController {
    constructor() {
        this.view = new ManagementView(this);

        this.usersController = new ManagementUsersController(this, api);
        this.studentsController = new ManagementStudentsController(this, api);
        this.passagesController = new ManagementPassagesController(this, api);
        this.qrCodesController = new ManagementQrCodesController(this, api);
        this.schedulesController = new ManagementSchedulesController(this, api);
        this.classesController = new ManagementClassesController(this, api);
        this.matieresController = new ManagementMatieresController(this, api);

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

        ['loadScheduleOptions', 'refreshScheduleOptions', 'loadScheduleSlots', 'loadSchedules', 'addSchedule', 'updateSchedule', 'deleteSchedule']
            .forEach(m => delegate(m, this.schedulesController));

        ['loadClasses', 'addClass', 'updateClass', 'deleteClass'].forEach(m => delegate(m, this.classesController));
        ['loadMatieres', 'addMatiere', 'updateMatiere', 'deleteMatiere'].forEach(m => delegate(m, this.matieresController));
    }

    async loadManagement(section = 'passages') {
        await this.view.render(section);
        await this.loadScheduleOptions();
        await this.loadPassageFormStudents();
        await this.loadScheduleSlots();
    }
}

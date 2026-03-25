import ScanView from "../view/scanView.js";
import MovementsModel from "../model/movementsModel.js";

export default class ScanController {

        constructor() {
        this.model = new MovementsModel();
        this.view = new ScanView();
    }

    loadScan() {
        this.view.render();
    }

    addMovement(movementData) {
        this.model.addMovement(movementData);
    }

    async processScan(movementData) {
        try {
            const data = await this.model.save(movementData);

            if (data.success) {
                const now = new Date().toLocaleTimeString();
                this.view.renderNewScan(movementData.student_id, "Élève scanné", now);
                this.view.displayMessage("Succès !");
            } else {
                this.view.displayMessage(data.message, true);
            }
        } catch (error) {
            this.view.displayMessage("Erreur de connexion", true);
        }
    }
}

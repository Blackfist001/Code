import ManualEncodingView from "../view/manualEncodingView.js";
import MovementsModel from "../model/movementsModel.js";

export default class ManualEncodingController {

    constructor() {
        this.view = new ManualEncodingView(this);
        this.movementsModel = new MovementsModel();
    }   

    loadManualEncoding() {
        this.view.render();
    }

    addEncoding(encodingData) {
        // Valider les données
        if(!encodingData.idStudent || !encodingData.nameStudent) {
            alert('Veuillez remplir les champs obligatoires');
            return;
        }
        // Appeler le model pour ajouter le mouvement
        this.movementsModel.addMovement(encodingData);
    }
}
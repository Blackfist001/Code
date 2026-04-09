import ManualEncodingView from "../view/manualEncodingView.js";
import MovementsModel from "../model/movementsModel.js";
import api from "../api.js";

export default class ManualEncodingController {

    constructor() {
        this.view = new ManualEncodingView(this);
        this.movementsModel = new MovementsModel();
    }   

    loadManualEncoding() {
        this.view.render();
    }

    async addEncoding(encodingData) {
        // Valider les données
        if(!encodingData.id_etudiant) {
            alert('Veuillez spécifier l\'ID de l\'etudiant');
            return;
        }
        
        try {
            // Préparer les données
            const movementData = {
                id_etudiant:  encodingData.id_etudiant,
                type_passage: encodingData.type_passage || 'Entrée matin',
                statut:       encodingData.statut || 'Autorisé',
                date_passage: encodingData.date || new Date().toISOString().split('T')[0],
                heure_passage: encodingData.heure || new Date().toTimeString().split(' ')[0],
                scan:   false,
                manualEncoding: true,
            };
            
            const response = await api.addMovement(movementData);

            if (response.success) {
                this.view.clearForm();
                this.view.displayMessage('Passage enregistré avec succès', false);
                await this.view.refreshHistory();
            } else {
                this.view.displayMessage(response.message || 'Erreur lors de l\'enregistrement', true);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur: ' + error.message);
        }
    }
}
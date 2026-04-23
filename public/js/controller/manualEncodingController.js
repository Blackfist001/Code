import ManualEncodingView from "../view/manualEncodingView.js";
import MovementsModel from "../model/movementsModel.js";
import api from "../api.js";

/**
 * Contrôleur de l'encodage manuel des passages.
 * Permet d'ajouter un passage manuellement depuis le formulaire de la vue.
 */
export default class ManualEncodingController {

    constructor() {
        this.view = new ManualEncodingView(this);
        this.movementsModel = new MovementsModel();
    }   

    /**
     * Charge la page d'encodage manuel.
     */
    loadManualEncoding() {
        this.view.render();
    }

    /**
     * Valide et enregistre un passage encodé manuellement.
     * @param {Object} encodingData - Données du formulaire
     * @param {number|string} encodingData.id_etudiant - ID de l'étudiant (obligatoire)
     * @param {string} [encodingData.type_passage] - Type de passage
     * @param {string} [encodingData.statut]       - Statut du passage
     * @param {string|null} [encodingData.raison]  - Raison (optionnel)
     * @param {string} [encodingData.date]         - Date au format Y-m-d
     * @param {string} [encodingData.heure]        - Heure au format HH:MM:SS
     * @returns {Promise<void>}
     */
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
                raison:       encodingData.raison ?? null,
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
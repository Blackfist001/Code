import AbsenceView from '../view/absenceView.js';
import api from '../api.js';

/**
 * Contrôleur de la page des absences.
 * Coordonne AbsenceView et les appels API pour afficher et gérer les absences du jour.
 */
export default class AbsenceController {

    constructor() {
        this.view = new AbsenceView();
        this.view.setController(this);
    }

    /**
     * Charge la page des absences et les données associées.
     * @returns {Promise<void>}
     */
    async loadAbsent() {
        await this.view.render();
        await this.loadAbsents();
    }

    /**
     * Interroge l'API pour récupérer les absents du jour et met à jour la vue.
     * @returns {Promise<void>}
     */
    async loadAbsents() {
        try {
            const response = await api.getTodayAbsents();
            
            if (response.success) {
                this.view.displayAbsents(response.results);
            } else {
                this.view.displayAbsents([]);
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.view.displayAbsents([]);
        }
    }

    /**
     * Enregistre un étudiant comme absent et recharge la liste.
     * @param {number|string} studentId - ID de l'étudiant
     * @param {string|null} [reason=null] - Raison optionnelle
     * @returns {Promise<void>}
     */
    async markAbsent(studentId, reason = null) {
        try {
            const response = await api.markAbsent(studentId, reason);
            if (response.success) {
                alert(response.message);
                this.loadAbsents(); // Recharger la liste
            } else {
                alert(response.message || 'Erreur lors de marquage absent');
                console.error('Error:', response);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de marquage absent');
        }
    }
}
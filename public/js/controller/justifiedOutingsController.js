import JustifiedOutingsView from '../view/justifiedOutingsView.js';
import api from '../api.js';

export default class JustifiedOutingsController {

    constructor() {
        this.view = new JustifiedOutingsView();
        this.view.setController(this);
    }

    loadJustifiedOutings() {
        this.view.render();
    }

    async markJustifiedOuting(studentId, reason = null) {
        try {
            const data = {
                id_etudiant: studentId,
                type_passage: 'sortie_justifie',
                statut: 'sortie_justifie',
                reason: reason
            };
            
            const response = await api.addMovement(data);
            
            if (response.success) {
                alert('Sortie justifiée enregistrée');
                this.view.refresh();
            } else {
                alert(response.message || 'Erreur');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
import AbsentView from '../view/absentView.js';
import api from '../api.js';

export default class AbsentController {

    constructor() {
        this.view = new AbsentView();
        this.view.setController(this);
    }

    loadAbsent() {
        this.view.render();
        this.loadAbsents();
    }

    async loadAbsents() {
        try {
            const response = await api.request('getTodayAbsents.php');
            
            if (response.success) {
                this.view.displayAbsents(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async markAbsent(studentId, reason = null) {
        try {
            const data = {
                id_etudiant: studentId,
                reason: reason
            };
            
            const response = await api.request('markAbsent.php', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                alert(response.message);
                this.loadAbsents(); // Recharger la liste
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
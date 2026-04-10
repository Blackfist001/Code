import AbsenceView from '../view/absenceView.js';
import api from '../api.js';

export default class AbsenceController {

    constructor() {
        this.view = new AbsenceView();
        this.view.setController(this);
    }

    async loadAbsent() {
        await this.view.render();
        await this.loadAbsents();
    }

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
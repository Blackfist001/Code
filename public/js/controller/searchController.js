import SearchView from "../view/searchView.js";
import StudentsModel from "../model/studentsModel.js";
import api from "../api.js";

export default class SearchController {

    constructor() {
        this.view = new SearchView(this);
        this.studentsModel = new StudentsModel();
    }

    loadSearch() {
        this.view.render();
    }

    async searchStudent(query) {
        // Valider la requête
        if(!query || query.trim() === '') {
            alert('Veuillez entrer une recherche');
            return;
        }
        
        try {
            const response = await api.searchStudents(query);
            
            if (response.success) {
                this.view.displayResults(response.results);
            } else {
                alert(response.message || 'Aucun résultat trouvé');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la recherche');
        }
    }

    async getStudentStats(studentId) {
        try {
            const response = await api.request(`getStudentStats.php?id=${studentId}`);
            
            if (response.success) {
                this.view.displayStudentDetails(response);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
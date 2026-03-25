import SearchView from "../view/searchView.js";
import StudentsModel from "../model/studentsModel.js";

export default class SearchController {

    constructor() {
        this.view = new SearchView(this);
        this.studentsModel = new StudentsModel();
    }

    loadSearch() {
        this.view.render();
    }

    searchStudent(query) {
        // Valider la requête
        if(!query || query.trim() === '') {
            alert('Veuillez entrer une recherche');
            return;
        }
        // Appeler le model pour rechercher les étudiants
        this.studentsModel.searchStudents(query);
    }
}
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

    async searchStudent() {
        // Collecter les valeurs des champs de recherche
        const filters = {
            sourcedId: document.getElementById('search-sourcedId').value.trim(),
            name: document.getElementById('search-name').value.trim(),
            surname: document.getElementById('search-surname').value.trim(),
            classe: document.getElementById('search-classe').value,
            statut: document.getElementById('search-statut').value
        };

        // Vérifier qu'au moins un filtre est rempli
        const hasFilters = Object.values(filters).some(value => value !== '');
        if (!hasFilters) {
            alert('Veuillez entrer au moins un critère de recherche');
            return;
        }

        try {
            const result = await this.studentsModel.searchStudents(filters);

            if (result.success) {
                this.view.displayResults(result.results);
            } else {
                alert(result.message || 'Aucun résultat trouvé');
                this.view.displayResults([]);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la recherche');
            this.view.displayResults([]);
        }
    }

    resetSearch() {
        document.getElementById('search-sourcedId').value = '';
        document.getElementById('search-name').value = '';
        document.getElementById('search-surname').value = '';
        document.getElementById('search-classe').value = '';
        document.getElementById('search-statut').value = '';
        this.view.displayResults([]);
        this.view.clearMessage();
    }
}
import SearchView from "../view/searchView.js";
import StudentsModel from "../model/studentsModel.js";
import api from "../api.js";

/**
 * Contrôleur de la page de recherche.
 * Gère les recherches de passages par critères étudiant.
 */
export default class SearchController {

    constructor() {
        this.view = new SearchView(this);
        this.studentsModel = new StudentsModel();
    }

    /**
     * Charge la page de recherche.
     */
    loadSearch() {
        this.view.render();
    }

    /**
     * Récupère les valeurs des filtres du formulaire et lance une recherche de passages.
     * Au moins un filtre doit être rempli.
     * @returns {Promise<void>}
     */
    async searchStudent() {
        // Collecter les valeurs des champs de recherche
        const filters = {
            nom:    document.getElementById('search-name').value,
            prenom: document.getElementById('search-surname').value,
            classe: document.getElementById('search-classe').value,
            statut: document.getElementById('search-statut').value
        };

        // Vérifier qu'au moins un filtre est rempli
        const hasFilters = Object.values(filters).some(value => value !== '');
        if (!hasFilters) {
            this.view.displayResults([]);
            return;
        }

        try {
            const result = await api.searchMovementsByStudent(filters);

            if (result.success) {
                this.view.displayResults(result.results);
            } else {
                this.view.displayResults([]);
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.view.displayResults([]);
        }
    }
}
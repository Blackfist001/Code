import GestionView from "../view/gestionView.js";
import UsersModel from "../model/usersModel.js";

export default class GestionController {

    constructor() {
        this.view = new GestionView(this);
        this.usersModel = new UsersModel();
    }

    loadGestion() {
        this.view.render();
    }

    addUser(userData) {
        // Valider les données
        if(!userData.name || !userData.password || !userData.role) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        // Appeler le model pour ajouter l'utilisateur
        this.usersModel.addUser(userData);
    }
}
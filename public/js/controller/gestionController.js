import GestionView from "../view/gestionView.js";
import UsersModel from "../model/usersModel.js";
import api from "../api.js";

export default class GestionController {

    constructor() {
        this.view = new GestionView(this);
        this.usersModel = new UsersModel();
    }

    loadGestion() {
        this.view.render();
        this.loadStudents();
    }

    async loadStudents() {
        try {
            const response = await api.request('listStudents.php');
            
            if (response.success) {
                this.view.displayStudents(response.results);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async addStudent(studentData) {
        // Valider les données
        if(!studentData.nom) {
            alert('Le nom est obligatoire');
            return;
        }
        
        try {
            const response = await api.request('addStudent.php', {
                method: 'POST',
                body: JSON.stringify(studentData)
            });
            
            if (response.success) {
                alert(response.message);
                this.loadStudents(); // Recharger la liste
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout');
        }
    }

    async deleteStudent(studentId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant?')) {
            try {
                const response = await api.request('deleteStudent.php', {
                    method: 'POST',
                    body: JSON.stringify({ id_etudiant: studentId })
                });
                
                if (response.success) {
                    alert(response.message);
                    this.loadStudents();
                }
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    }

    async addUser(userData) {
        // Valider les données
        if(!userData.username || !userData.password || !userData.role) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        try {
            const response = await api.request('addUser.php', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                alert(response.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}
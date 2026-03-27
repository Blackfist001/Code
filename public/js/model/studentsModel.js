export default class StudentsModel {

    constructor() {
        this.students = [];
    }

    searchStudents(query) {
        // Utiliser l'API centralisée
        return api.searchStudents(query)
            .then(data => {
                if(data.success) {
                    if(data.count === 0) {
                        alert('Aucun étudiant trouvé');
                    } else {
                        console.log(`${data.count} étudiant(s) trouvé(s):`, data.results);
                        // Afficher les résultats (à implémenter dans la vue)
                        alert(`${data.count} étudiant(s) trouvé(s)`);
                    }
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de la recherche');
                console.error('Error:', error);
            });
    }
}
export default class MovementsModel {

    constructor() {
        this.movements = [];
    }

    searchMovements(query) {
        // Utiliser l'API centralisée
        return api.searchMovements(query)
            .then(data => {
                if(data.success) {
                    if(data.count === 0) {
                        alert('Aucun mouvement trouvé');
                    } else {
                        console.log(`${data.count} mouvement(s) trouvé(s):`, data.results);
                        alert(`${data.count} mouvement(s) trouvé(s)`);
                    }
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de la recherche de mouvements');
                console.error('Error:', error);
            });
    }

    addMovement(movementData) {
        // Utiliser l'API centralisée
        return api.addMovement(movementData)
            .then(data => {
                if(data.success) {
                    alert('Mouvement enregistré avec succès');
                    console.log('Movement added:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de l\'enregistrement du mouvement');
                console.error('Error:', error);
            });
    }

    updateMovement(movementId, movementData) {
        // Utiliser l'API centralisée
        return api.updateMovement(movementId, movementData)
            .then(data => {
                if(data.success) {
                    alert('Mouvement mis à jour avec succès');
                    console.log('Movement updated:', data);
                } else {
                    alert(`Erreur: ${data.message}`);
                    console.error('Error:', data);
                }
            })
            .catch(error => {
                alert('Erreur lors de la mise à jour du mouvement');
                console.error('Error:', error);
            });
    }

    async save(movementData) {
        const formData = new FormData();
        formData.append('id_etudiant', movementData.id_etudiant);

        const response = await fetch('/scan/ajouter', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Erreur serveur');
        return await response.json();
    }
}
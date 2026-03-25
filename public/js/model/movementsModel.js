export default class MovementsModel {

    constructor() {
        this.movements = [];
    }

    searchMovements(query) {
        // Envoyer à PHP backend
        fetch(`php/api/searchMovements.php?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
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
        // Envoyer à PHP backend
        fetch('php/api/addMovement.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(movementData)
        })
        .then(response => response.json())
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
        // Envoyer à PHP backend
        fetch('php/api/updateMovement.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: movementId, ...movementData})
        })
        .then(response => response.json())
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
        formData.append('student_id', movementData.student_id);

        const response = await fetch('/scan/ajouter', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Erreur serveur');
        return await response.json();
    }
}
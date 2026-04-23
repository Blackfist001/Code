/**
 * Modèle des passages (mouvements).
 * Encapsule les appels API CRUD sur les passages et les conversions de données.
 */
export default class MovementsModel {

    constructor() {
        this.movements = [];
    }

    /**
     * Recherche les passages selon un objet de critères.
     * @param {Object} query - Critères de recherche (classe, statut, date…)
     * @returns {Promise<{success: boolean, count: number, results: Array}>}
     */
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

    /**
     * Ajoute un nouveau passage via l'API.
     * @param {Object} movementData - Données du passage (id_etudiant, type_passage…)
     * @returns {Promise<void>}
     */
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

    /**
     * Met à jour un passage existant via l'API.
     * @param {number|string} movementId - ID du passage
     * @param {Object} movementData     - Champs à modifier
     * @returns {Promise<void>}
     */
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

    /**
     * Enregistre un scan QR code directement via l'endpoint `/scan/ajouter`.
     * @param {{id_etudiant: string|number}} movementData
     * @returns {Promise<Object>} Réponse JSON du serveur
     */
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
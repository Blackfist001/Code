export default class UsersModel {

    constructor() {
        this.users = [];
    }

    addUser(userData) {
        // Envoyer à PHP backend
        fetch('php/api/addUser.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                alert(`Utilisateur ${userData.name} ajouté avec succès`);
                console.log('User added:', data);
            } else {
                alert(`Erreur: ${data.message}`);
                console.error('Error:', data);
            }
        })
        .catch(error => {
            alert('Erreur lors de l\'ajout de l\'utilisateur');
            console.error('Error:', error);
        });
    }

    removeUser(userId) {
        // Envoyer à PHP backend
        fetch('php/api/deleteUser.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: userId})
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                alert('Utilisateur supprimé avec succès');
                console.log('User removed:', data);
            } else {
                alert(`Erreur: ${data.message}`);
                console.error('Error:', data);
            }
        })
        .catch(error => {
            alert('Erreur lors de la suppression de l\'utilisateur');
            console.error('Error:', error);
        });
    }

    updateUser(userId, userData) {
        // Envoyer à PHP backend
        fetch('php/api/updateUser.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: userId, ...userData})
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                alert('Utilisateur mis à jour avec succès');
                console.log('User updated:', data);
            } else {
                alert(`Erreur: ${data.message}`);
                console.error('Error:', data);
            }
        })
        .catch(error => {
            alert('Erreur lors de la mise à jour de l\'utilisateur');
            console.error('Error:', error);
        });
    }

    getUsers() {
        // TODO: Envoyer à PHP backend
        console.log('Fetching users');
        console.log('TODO: Implement PHP backend for user retrieval');
        // Pour l'instant, afficher un message
        alert('Récupération des utilisateurs lancée (simulé)');
    }
}
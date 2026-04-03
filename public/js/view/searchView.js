export default class SearchView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/search.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachSearchHandler();
            })
            .catch(error => console.error('Error loading search:', error));
    }

    attachSearchHandler() {
        const searchButton = document.getElementById('btn-search');
        const resetButton = document.getElementById('btn-reset');
        
        if(searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.controller.searchStudent();
            });
        }
        
        if(resetButton) {
            resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.controller.resetSearch();
            });
        }
        
        // Allow search on Enter key in any input field
        const inputs = ['search-sourcedId', 'search-name', 'search-surname'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.addEventListener('keypress', (e) => {
                    if(e.key === 'Enter') {
                        this.controller.searchStudent();
                    }
                });
            }
        });
    }

    displayResults(results) {
        const tbody = document.getElementById('search-results-body');
        const messageDiv = document.getElementById('search-message');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!results || results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Aucun résultat trouvé</td></tr>';
            if (messageDiv) messageDiv.textContent = 'Aucun étudiant trouvé';
            return;
        }
        
        results.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id_etudiant || '---'}</td>
                <td>${student.nom || '---'}</td>
                <td>${student.prenom || '---'}</td>
                <td>${student.classe || '---'}</td>
                <td>${student.passages_count || 0}</td>
                <td class="status-ok">Actif</td>
            `;
            tbody.appendChild(row);
        });
        
        if (messageDiv) messageDiv.textContent = `${results.length} résultat(s) trouvé(s)`;
    }

    clearMessage() {
        const messageDiv = document.getElementById('search-message');
        if (messageDiv) {
            messageDiv.textContent = '';
        }
    }
}
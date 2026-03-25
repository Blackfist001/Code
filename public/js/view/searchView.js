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
        const button = document.getElementById('btn-search');
        const input = document.getElementById('search-input');
        
        if(button && input) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const query = input.value;
                if(query.trim()) {
                    this.controller.searchStudent(query);
                }
            });
            
            // Allow search on Enter key
            input.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') {
                    const query = input.value;
                    if(query.trim()) {
                        this.controller.searchStudent(query);
                    }
                }
            });
        }
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

    displayStudentDetails(details) {
        const tbody = document.getElementById('search-results-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td>${details.id_etudiant || '---'}</td>
                    <td>${details.nom || '---'}</td>
                    <td>${details.prenom || '---'}</td>
                    <td>${details.classe || '---'}</td>
                    <td>${details.total_passages || 0}</td>
                    <td class="status-ok">${details.statut || 'Actif'}</td>
                </tr>
            `;
        }
    }
}
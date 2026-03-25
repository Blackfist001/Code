export default class JustifiedOutingsView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
    }

    setController(controller) {
        this.controller = controller;
    }

    render() {
        fetch('html/justifiedOutings.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachEventListeners();
                if (this.controller) {
                    this.loadOutings();
                }
            });
    }

    attachEventListeners() {
        const addBtn = document.getElementById('btn-add-justified');
        if (addBtn && this.controller) {
            addBtn.addEventListener('click', () => {
                const studentId = document.getElementById('justified-student-id').value;
                const reason = document.getElementById('justified-reason').value;
                
                if (studentId && reason) {
                    this.controller.markJustifiedOuting(studentId, reason);
                    document.getElementById('justified-student-id').value = '';
                    document.getElementById('justified-reason').value = '';
                }
            });
        }

        const refreshBtn = document.getElementById('btn-refresh-justified');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadOutings();
            });
        }
    }

    loadOutings() {
        // This will be called by the controller
        if (this.controller) {
            // Load justified outings data
            console.log('Loading justified outings...');
        }
    }

    displayOutings(outings = []) {
        const tbody = document.getElementById('justified-outings-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!outings || outings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Aucune sortie justifiée</td></tr>';
            return;
        }
        
        outings.forEach(outing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${outing.date_passage || '---'}</td>
                <td>${outing.heure_passage || '---'}</td>
                <td>${outing.nom || '---'}</td>
                <td>${outing.prenom || '---'}</td>
                <td>${outing.classe || '---'}</td>
                <td class="status-ok">Sortie justifiée</td>
                <td>${outing.reason || '---'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    refresh() {
        if (this.controller) {
            this.loadOutings();
            const messageDiv = document.getElementById('justified-message');
            if (messageDiv) {
                messageDiv.textContent = 'Sortie justifiée enregistrée';
                messageDiv.style.color = 'green';
                setTimeout(() => {
                    messageDiv.textContent = '';
                }, 3000);
            }
        }
    }
}
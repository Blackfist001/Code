export default class ScanView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/scan.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.scanHistory = [];
            });
    }

    renderNewScan(studentId, name, time) {
        // Afficher le résultat du scan
        const resultDiv = document.getElementById('scan-result');
        const messageDiv = document.getElementById('message');
        
        if (resultDiv) {
            document.getElementById('name-value').textContent = name;
            document.getElementById('type-value').textContent = 'Passage enregistré';
            document.getElementById('status-value').textContent = 'ACCEPTÉ';
            resultDiv.style.display = 'block';
        }
        
        if (messageDiv) {
            messageDiv.textContent = `Scan enregistré: ${name} à ${time}`;
            messageDiv.style.color = 'green';
        }
        
        // Ajouter à l'historique
        this.addToHistory(time, name, studentId);
    }

    addToHistory(time, name, studentId) {
        const tbody = document.getElementById('scan-history-body');
        if (!tbody) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${time}</td>
            <td>${name.split(' ')[1] || '---'}</td>
            <td>${name.split(' ')[0] || name}</td>
            <td>Entrée</td>
            <td class="status-ok">OK</td>
        `;
        
        tbody.insertBefore(row, tbody.firstChild);
        
        // Garder seulement les 10 derniers
        while (tbody.children.length > 10) {
            tbody.removeChild(tbody.lastChild);
        }
    }

    displayMessage(text, isError = false) {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.style.color = isError ? 'red' : 'green';
            
            // Auto-hide après 3 secondes
            setTimeout(() => {
                messageDiv.textContent = '';
            }, 3000);
        }
    }
}


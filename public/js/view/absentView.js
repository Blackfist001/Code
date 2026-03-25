export default class AbsentView {

    constructor() {
        this.container = document.getElementById('container');
        this.controller = null;
    }

    setController(controller) {
        this.controller = controller;
    }

    render() {
        fetch('html/absent.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachEventListeners();
            });
    }

    displayAbsents(absents = []) {
        const tbody = document.getElementById('absents-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!absents || absents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Aucun absent enregistré</td></tr>';
            return;
        }
        
        absents.forEach(absent => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${absent.date_passage || '---'}</td>
                <td>${absent.nom || '---'}</td>
                <td>${absent.prenom || '---'}</td>
                <td>${absent.classe || '---'}</td>
                <td>${absent.reason || '---'}</td>
                <td class="status-refuse">Absent</td>
                <td>
                    <button class="btn-mark-absent" data-student-id="${absent.id_etudiant}">
                        Justifier
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('btn-refresh-absents');
        if (refreshBtn && this.controller) {
            refreshBtn.addEventListener('click', () => {
                this.controller.loadAbsents();
            });
        }

        const addAbsentBtn = document.getElementById('btn-add-absent');
        if (addAbsentBtn && this.controller) {
            addAbsentBtn.addEventListener('click', () => {
                const studentId = document.getElementById('absent-student-id').value;
                const reason = document.getElementById('absent-reason').value;
                if (studentId) {
                    this.controller.markAbsent(studentId, reason);
                }
            });
        }

        // Event delegation for justify buttons
        const tbody = document.getElementById('absents-table-body');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-mark-absent')) {
                    const studentId = e.target.getAttribute('data-student-id');
                    if (this.controller) {
                        this.controller.markAbsent(studentId, 'Justifié');
                    }
                }
            });
        }
    }
}
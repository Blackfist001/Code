export default class ScanView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render(onReady = null) {
        fetch('html/scan.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.scanHistory = [];
                if (typeof onReady === 'function') {
                    onReady();
                }
            });
    }

    renderNewScan(name, classe, typeLabel, statut, statutLabel) {
        // Afficher le résultat du scan
        const resultDiv = document.getElementById('scan-result');
        const messageDiv = document.getElementById('message');

        if (resultDiv) {
            document.getElementById('name-value').textContent = name;
            document.getElementById('class-value').textContent = classe;
            document.getElementById('type-value').textContent = typeLabel;

            const statusEl = document.getElementById('status-value');
            const isPositive = statut === 'Présent' || statut === 'Autorisé';
            statusEl.textContent = statutLabel;
            statusEl.className = `status-badge ${isPositive ? 'status-present' : 'status-refuse'}`;

            resultDiv.style.display = 'block';
        }

        if (messageDiv) {
            const isRefuse = statut === 'Refusé';
            messageDiv.textContent = isRefuse
                ? `⚠ ${name} — ${statutLabel}`
                : `✓ ${name} — ${statutLabel}`;
            messageDiv.style.color = (statut === 'Présent' || statut === 'Autorisé') ? 'green' : 'red';
        }
    }

    displaySchedule(schedule) {
        const table = document.querySelector('.card table');
        const thead = table?.querySelector('thead');
        const tbody = document.getElementById('scan-schedule-body');
        if (!thead || !tbody) return;

        const timeSlots = [
            {label: '8H15', value: '08:15'},
            {label: '9H05', value: '09:05'},
            {label: '10H10', value: '10:10'},
            {label: '11H00', value: '11:00'},
            {label: '11H50', value: '11:50'},
            {label: '12H40', value: '12:40'},
            {label: '13H30', value: '13:30'},
            {label: '14H20', value: '14:20'},
            {label: '15H10', value: '15:10'},
            {label: '16H00', value: '16:00'}
        ];

        // Construire l'en-tête avec les créneaux fixes
        thead.innerHTML = '<tr>' + timeSlots.map(slot => `<th>${slot.label}</th>`).join('') + '</tr>';

        // Construire la ligne de matières
        const row = document.createElement('tr');

        const normalizedSchedule = (schedule || []).map(item => {
            return {
                matiere: item.matiere || item.subject || '---',
                heure_debut: (item.heure_debut || item.time || '').substring(0,5)
            };
        });

        timeSlots.forEach(slot => {
            const cell = document.createElement('td');
            const matched = normalizedSchedule.find(item => item.heure_debut === slot.value || item.heure_debut === slot.value.replace(':', ':'));
            cell.textContent = matched ? matched.matiere : '---';
            row.appendChild(cell);
        });

        tbody.innerHTML = '';
        tbody.appendChild(row);
    }

    addToHistory(time, name, studentId) {
        const schedules = {
            '6A': [
                { time: '08:00 - 09:00', subject: 'Mathématiques', room: '101' },
                { time: '09:00 - 10:00', subject: 'Français', room: '102' },
                { time: '10:15 - 11:15', subject: 'Histoire', room: '103' },
                { time: '11:15 - 12:15', subject: 'Science', room: '104' }
            ],
            '6B': [
                { time: '08:00 - 09:00', subject: 'Français', room: '102' },
                { time: '09:00 - 10:00', subject: 'Mathématiques', room: '101' },
                { time: '10:15 - 11:15', subject: 'Géographie', room: '103' },
                { time: '11:15 - 12:15', subject: 'Anglais', room: '105' }
            ],
            'default': [
                { time: '08:00 - 09:00', subject: 'Mathématiques', room: '101' },
                { time: '09:00 - 10:00', subject: 'Français', room: '102' },
                { time: '10:15 - 11:15', subject: 'Sciences', room: '104' },
                { time: '11:15 - 12:15', subject: 'Éducation physique', room: 'Gymnase' }
            ]
        };

        return schedules[classe] || schedules['default'];
    }

    renderSchedule(classe) {
        const tbody = document.getElementById('scan-schedule-body');
        if (!tbody) return;

        const schedule = this.getScheduleForClass(classe);
        tbody.innerHTML = '';

        schedule.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.time}</td>
                <td>${item.subject}</td>
                <td>${item.room}</td>
            `;
            tbody.appendChild(row);
        });
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


export default class ManualEncodingView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/manualEncoding.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachEventListeners();
            })
            .catch(error => console.error('Error loading manual encoding:', error));
    }

    attachEventListeners() {
        const addBtn = document.getElementById('btn-add-encoding');
        const typeSelect = document.getElementById('encoding-type');
        const reasonSelect = document.getElementById('encoding-reason');
        
        if (addBtn && this.controller) {
            addBtn.addEventListener('click', () => {
                const idStudent = document.getElementById('encoding-id-student').value;
                const type = document.getElementById('encoding-type').value;
                const date = document.getElementById('encoding-date').value;
                const time = document.getElementById('encoding-time').value;
                
                if (idStudent) {
                    const encodingData = {
                        id_etudiant: idStudent,
                        type_passage: type,
                        date: date || new Date().toISOString().split('T')[0],
                        heure: time || new Date().toTimeString().split(' ')[0],
                        statut: 'autorise'
                    };
                    this.controller.addEncoding(encodingData);
                }
            });
        }

        // Show/hide reason based on type
        if (typeSelect && reasonSelect) {
            typeSelect.addEventListener('change', () => {
                if (typeSelect.value === 'sortie_justifiee') {
                    reasonSelect.style.display = 'block';
                } else {
                    reasonSelect.style.display = 'none';
                }
            });
        }
    }

    clearForm() {
        document.getElementById('encoding-id-student').value = '';
        document.getElementById('encoding-name-student').value = '';
        document.getElementById('encoding-surname-student').value = '';
        document.getElementById('encoding-type').value = 'entree_matin';
        document.getElementById('encoding-date').value = '';
        document.getElementById('encoding-time').value = '';
        document.getElementById('encoding-reason').style.display = 'none';
        document.getElementById('encoding-reason').value = '';
        
        const messageDiv = document.getElementById('encoding-message');
        if (messageDiv) {
            messageDiv.textContent = 'Passage enregistré avec succès';
            messageDiv.style.color = 'green';
            setTimeout(() => {
                messageDiv.textContent = '';
            }, 3000);
        }
    }
}
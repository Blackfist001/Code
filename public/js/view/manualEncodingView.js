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
                this.attachFormHandler();
            })
            .catch(error => console.error('Error loading manual encoding:', error));
    }

    attachFormHandler() {
        const form = document.querySelector('form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const encodingData = {
                    idStudent: document.getElementById('id-student').value,
                    nameStudent: document.getElementById('name-student').value,
                    surnameStudent: document.getElementById('surname-student').value,
                    inputOutput: document.getElementById('input-output').value,
                    reason: document.getElementById('reason').value
                };
                if(encodingData.idStudent && encodingData.nameStudent) {
                    this.controller.addEncoding(encodingData);
                    form.reset();
                }
            });
        }
    }
}
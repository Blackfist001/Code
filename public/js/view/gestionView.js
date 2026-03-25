export default class GestionView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/gestion.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachFormHandler();
            })
            .catch(error => console.error('Error loading gestion:', error));
    }

    attachFormHandler() {
        const form = document.querySelector('form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const userData = {
                    name: document.getElementById('name').value,
                    password: document.getElementById('password').value,
                    role: document.getElementById('role').value
                };
                if(userData.name && userData.password && userData.role) {
                    this.controller.addUser(userData);
                    form.reset();
                }
            });
        }
    }
}
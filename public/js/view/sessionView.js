export default class SessionView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
        this.nav = document.getElementById('nav');
    }

    renderLogin() {
            fetch('html/login.html')
                .then(response => response.text())
                .then(data => {
                    this.container.innerHTML = data;
                    this.attachLoginHandler();
                })
                .catch(error => console.error('Error loading login:', error));
    }

    attachLoginHandler() {
        const form = document.querySelector('form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                if(username && password) {
                    this.controller.login(username, password);
                }
            });
        }
    }

    renderUser() {
            fetch('html/navUser.html')
                .then(response => response.text())
                .then(data => {
                this.nav.innerHTML = data;
                });
            fetch('html/scan.html')
                .then(response => response.text())
                .then(data => {
                this.container.innerHTML = data;
                });
    }

    renderAdmin() {
            fetch('html/navAdmin.html')
                .then(response => response.text())
                .then(data => {
                this.nav.innerHTML = data;
                });
            fetch('html/dashboard.html')
                .then(response => response.text())
                .then(data => {
                this.container.innerHTML = data;
                });
    }

    renderGestion() {
            fetch('html/navGestion.html')
                .then(response => response.text())
                .then(data => {
                this.nav.innerHTML = data;
                });
            fetch('html/dashboard.html')
                .then(response => response.text())
                .then(data => {
                this.container.innerHTML = data;
                });
    }
}
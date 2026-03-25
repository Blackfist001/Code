export default class DashboardView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/dashboard.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
            });
    }
}
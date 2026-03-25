export default class JustifiedOutingsView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/justifiedOutings.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
            });
    }
}
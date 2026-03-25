export default class AbsentView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/absent.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
            });
    }
}
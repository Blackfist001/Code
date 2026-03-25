export default class HistoricalView {

    constructor() {
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/historical.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
            });
    }
}
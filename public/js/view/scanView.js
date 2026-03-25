export default class ScanView {

    constructor() {
        this.container = document.getElementById('container');
        this.listElement = document.getElementById('liste-scans');
        this.feedbackElement = document.getElementById('message-feedback');
        }

    render() {
        fetch('html/scan.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
            });
    }

    renderNewScan(studentId, name, time) {
        const html = `
            <div class="scan-row">
                <span>${time}</span> | <strong>${name}</strong> (ID: ${studentId})
            </div>
        `;
        this.listElement.insertAdjacentHTML('afterbegin', html);
    }

    displayMessage(text, isError = false) {
        this.feedbackElement.textContent = text;
        this.feedbackElement.style.color = isError ? 'red' : 'green';
    }
}


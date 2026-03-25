export default class SearchView {

    constructor(controller) {
        this.controller = controller;
        this.container = document.getElementById('container');
    }

    render() {
        fetch('html/search.html')
            .then(response => response.text())
            .then(data => {
                this.container.innerHTML = data;
                this.attachSearchHandler();
            })
            .catch(error => console.error('Error loading search:', error));
    }

    attachSearchHandler() {
        const button = document.querySelector('button');
        const input = document.querySelector('input[type="text"]');
        if(button && input) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const query = input.value;
                if(query.trim()) {
                    this.controller.searchStudent(query);
                }
            });
            // Allow search on Enter key
            input.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') {
                    const query = input.value;
                    if(query.trim()) {
                        this.controller.searchStudent(query);
                    }
                }
            });
        }
    }
}
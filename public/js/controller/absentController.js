import AbsentView from '../view/absentView.js';

export default class AbsentController {

    constructor() {
        this.view = new AbsentView();
    }

    loadAbsent() {
        this.view.render();
    }
}
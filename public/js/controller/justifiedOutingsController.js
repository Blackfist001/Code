import JustifiedOutingsView from '../view/justifiedOutingsView.js';

export default class JustifiedOutingsController {

    constructor() {
        this.view = new JustifiedOutingsView();
    }

    loadJustifiedOutings() {
        this.view.render();
    }
}
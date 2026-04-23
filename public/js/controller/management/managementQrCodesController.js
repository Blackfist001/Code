/**
 * Sous-contrôleur d'affichage des QR codes étudiants.
 */
export default class ManagementQrCodesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    /**
     * Charge la liste des étudiants pour générer leurs QR codes.
     * @returns {Promise<void>}
     */
    async loadQrCodes() {
        try {
            const response = await this.api.getAllStudents();
            this.parent.view.displayQrCodesStudents(response.success ? response.results : []);
        } catch (error) {
            console.error('Erreur loadQrCodes:', error);
            this.parent.view.displayQrCodesStudents([]);
        }
    }
}
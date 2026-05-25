export default class ManagementPassageTypesController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    async loadPassageMetadata() {
        try {
            const [types, statuses, reasons] = await Promise.all([
                this.api.getPassageMetadata('types'),
                this.api.getPassageMetadata('statuses'),
                this.api.getPassageMetadata('reasons'),
            ]);

            this.parent.view.displayPassageMetadata({
                types: types?.success ? (types.results || []) : [],
                statuses: statuses?.success ? (statuses.results || []) : [],
                reasons: reasons?.success ? (reasons.results || []) : [],
            });
        } catch (error) {
            console.error('Erreur loadPassageMetadata:', error);
            this.parent.view.displayPassageMetadata({ types: [], statuses: [], reasons: [] });
        }
    }

    async updatePassageMetadata(kind, id, label) {
        try {
            const response = await this.api.updatePassageMetadata(kind, id, { label });
            if (response.success) {
                this.parent.view.passageTypesView.notify('Valeur mise à jour.', 'success');
                await this.loadPassageMetadata();
            } else {
                this.parent.view.passageTypesView.notify(response.message || 'Erreur lors de la mise à jour.', 'error');
            }
        } catch (error) {
            console.error('Erreur updatePassageMetadata:', error);
            this.parent.view.passageTypesView.notify('Erreur lors de la mise à jour.', 'error');
        }
    }

    async addPassageMetadata(kind, label) {
        try {
            const response = await this.api.createPassageMetadata(kind, { label });
            if (response.success) {
                this.parent.view.passageTypesView.notify('Valeur ajoutée.', 'success');
                await this.loadPassageMetadata();
                return { success: true, message: response.message || 'Valeur ajoutée.' };
            } else {
                this.parent.view.passageTypesView.notify(response.message || 'Erreur lors de l\'ajout.', 'error');
                return { success: false, message: response.message || 'Erreur lors de l\'ajout.' };
            }
        } catch (error) {
            console.error('Erreur addPassageMetadata:', error);
            this.parent.view.passageTypesView.notify('Erreur lors de l\'ajout.', 'error');
            return { success: false, message: 'Erreur lors de l\'ajout.' };
        }
    }

    async deletePassageMetadata(kind, id) {
        try {
            const response = await this.api.deletePassageMetadata(kind, id);
            if (response.success) {
                this.parent.view.passageTypesView.notify('Valeur supprimée.', 'success');
                await this.loadPassageMetadata();
            } else {
                this.parent.view.passageTypesView.notify(response.message || 'Erreur lors de la suppression.', 'error');
            }
        } catch (error) {
            console.error('Erreur deletePassageMetadata:', error);
            this.parent.view.passageTypesView.notify('Erreur lors de la suppression.', 'error');
        }
    }
}

/**
 * Sous-controleur de gestion des creneaux debut/fin.
 */
export default class ManagementSlotsController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
    }

    async loadSlots() {
        await this.parent.loadScheduleSlots();
        this.parent.view.displaySlots();
    }

    async addSlot(data) {
        if (!data?.creneau || !data?.type) {
            alert('Type et heure requis.');
            return;
        }

        try {
            const response = await this.api.addScheduleSlot({
                type: data.type,
                creneau: data.creneau,
            });

            if (response.success) {
                await this.parent.loadScheduleSlots();
                this.parent.view.displaySlots();
                this.parent.view.schedulesView.updateSlotOptions();
            } else {
                alert(response.message || 'Erreur lors de l\'ajout du creneau');
            }
        } catch (error) {
            console.error('Erreur addSlot:', error);
        }
    }

    async updateSlot(id, data) {
        if (!id || !data?.creneau || !data?.type) {
            alert('ID, type et heure requis.');
            return;
        }

        try {
            const response = await this.api.updateScheduleSlot(id, {
                type: data.type,
                creneau: data.creneau,
            });

            if (response.success) {
                await this.parent.loadScheduleSlots();
                this.parent.view.displaySlots();
                this.parent.view.schedulesView.updateSlotOptions();
            } else {
                alert(response.message || 'Erreur lors de la modification du creneau');
            }
        } catch (error) {
            console.error('Erreur updateSlot:', error);
        }
    }

    async deleteSlot(id, type) {
        if (!id || !type) {
            alert('ID et type requis.');
            return;
        }

        try {
            const response = await this.api.deleteScheduleSlot(id, type);
            if (response.success) {
                await this.parent.loadScheduleSlots();
                this.parent.view.displaySlots();
                this.parent.view.schedulesView.updateSlotOptions();
            } else {
                alert(response.message || 'Erreur lors de la suppression du creneau');
            }
        } catch (error) {
            console.error('Erreur deleteSlot:', error);
        }
    }
}

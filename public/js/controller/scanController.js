import ScanView from "../view/scanView.js";
import MovementsModel from "../model/movementsModel.js";
import api from "../api.js";

export default class ScanController {

    constructor() {
        this.model = new MovementsModel();
        this.view = new ScanView();
        this.isProcessing = false; // verrou anti-double-scan
    }

    loadScan() {
        this.view.render(() => this.attachEventListeners());
    }

    attachEventListeners() {
        const scanInput = document.getElementById('scan-input');
        if (scanInput) {
            scanInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const val = scanInput.value.trim();
                    scanInput.value = '';
                    this.processScan(val);
                }
            });
        }

        const scanButton = document.getElementById('btn-submit-scan');
        if (scanButton) {
            scanButton.addEventListener('click', () => {
                const input = document.getElementById('scan-input');
                if (input) {
                    const val = input.value.trim();
                    input.value = '';
                    this.processScan(val);
                }
            });
        }
    }

    addMovement(movementData) {
        this.model.addMovement(movementData);
    }

    async processScan(sourcedId) {
        if (!sourcedId) {
            this.view.displayMessage('ID étudiant requis', true);
            return;
        }

        // Bloquer les appels simultanés (double Enter, Enter + bouton, etc.)
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Le backend détermine automatiquement type_passage et statut
            const response = await api.scanStudent(sourcedId);

            if (response.success) {
                const student = response.student;
                this.view.renderNewScan(
                    `${student.prenom} ${student.nom}`,
                    student.classe || '---',
                    response.type_label,
                    response.statut,
                    response.statut_label
                );

                // Emploi du temps du jour par classe
                const jour = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
                const scheduleResponse = await api.getScheduleByClass(student.classe || 'default', jour);
                if (scheduleResponse.success) {
                    this.view.displaySchedule(scheduleResponse.schedule);
                } else {
                    this.view.displaySchedule([]);
                }
            } else {
                this.view.displayMessage(response.message || 'Erreur lors du scan', true);
            }
        } catch (error) {
            this.view.displayMessage('Erreur: ' + error.message, true);
            console.error('Erreur:', error);
        } finally {
            // Libérer le verrou après 1 seconde minimum entre deux scans
            setTimeout(() => { this.isProcessing = false; }, 1000);
        }
    }

    async save(movementData) {
        try {
            const response = await api.addMovement(movementData);
            return response;
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }
}

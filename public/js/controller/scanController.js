import ScanView from "../view/scanView.js";
import MovementsModel from "../model/movementsModel.js";
import api from "../api.js";

export default class ScanController {

        constructor() {
        this.model = new MovementsModel();
        this.view = new ScanView();
    }

    loadScan() {
        this.view.render();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Attendre que le HTML soit chargé
        setTimeout(() => {
            const scanInput = document.getElementById('scan-input');
            if (scanInput) {
                scanInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.processScan(scanInput.value);
                        scanInput.value = '';
                    }
                });
            }

            const scanButton = document.getElementById('btn-submit-scan');
            if (scanButton) {
                scanButton.addEventListener('click', () => {
                    const input = document.getElementById('scan-input');
                    if (input && input.value) {
                        this.processScan(input.value);
                        input.value = '';
                    }
                });
            }
        }, 500);
    }

    addMovement(movementData) {
        this.model.addMovement(movementData);
    }

    async processScan(studentId) {
        if (!studentId) {
            this.view.displayMessage('ID étudiant requis', true);
            return;
        }

        try {
            // Préparer les données du scan
            const movementData = {
                id_etudiant: studentId,
                type_passage: 'entree_matin',
                statut: 'autorise'
            };

            // Envoyer à l'API
            const response = await api.addMovement(movementData);

            if (response.success) {
                // Récupérer les infos de l'étudiant
                const studentResponse = await api.getStudentById(studentId);
                
                if (studentResponse.success && studentResponse.result) {
                    const student = studentResponse.result;
                    const now = new Date().toLocaleTimeString();
                    this.view.renderNewScan(
                        studentId,
                        `${student.prenom} ${student.nom}`,
                        now,
                        student.classe || '---'
                    );
                    this.view.displayMessage(`Scan: ${student.prenom} ${student.nom}`);

                    // Récupérer et afficher l'emploi du temps dynamique par classe
                    const jour = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
                    const scheduleResponse = await api.getScheduleByClass(student.classe || 'default', jour);

                    if (scheduleResponse.success) {
                        this.view.displaySchedule(scheduleResponse.schedule);
                    } else {
                        this.view.displaySchedule([]);
                    }
                }
            } else {
                this.view.displayMessage(response.message || 'Erreur lors du scan', true);
            }
        } catch (error) {
            this.view.displayMessage('Erreur: ' + error.message, true);
            console.error('Erreur:', error);
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

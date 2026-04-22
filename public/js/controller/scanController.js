import ScanView from "../view/scanView.js";
import MovementsModel from "../model/movementsModel.js";
import api from "../api.js";
import QrScanner from "../vendor/qr-scanner.min.js";

export default class ScanController {

    constructor() {
        this.model = new MovementsModel();
        this.view = new ScanView();
        this.isProcessing = false; // verrou anti-double-scan
        this.qrScanner = null;
        this.lastScannedValue = '';
        this.lastScanAt = 0;
        this.audioContext = null;
    }

    loadScan() {
        this.view.render(() => {
            this.attachEventListeners();
            this.initQrScanner();
            this.setupAutoCleanup();
        });
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

        const startButton = document.getElementById('btn-start-camera');
        if (startButton) {
            startButton.addEventListener('click', async () => {
                await this.startCamera();
            });
        }

        const stopButton = document.getElementById('btn-stop-camera');
        if (stopButton) {
            stopButton.addEventListener('click', async () => {
                await this.stopCamera();
            });
        }
    }

    async initQrScanner() {
        const video = document.getElementById('qr-video');
        const cameraStatus = document.getElementById('camera-status');

        if (!video) {
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (cameraStatus) {
                cameraStatus.textContent = 'Camera non disponible sur cet appareil.';
            }
            this.view.displayMessage('Camera non disponible sur cet appareil.', true);
            return;
        }

        this.destroyCamera();

        this.qrScanner = new QrScanner(
            video,
            (result) => this.handleQrResult(result),
            {
                returnDetailedScanResult: true,
                highlightScanRegion: true,
                highlightCodeOutline: true,
            }
        );

        try {
            await this.startCamera();
        } catch (error) {
            console.error('Erreur camera:', error);
            this.view.displayMessage('Impossible de demarrer la camera.', true);
            if (cameraStatus) {
                cameraStatus.textContent = 'Autorise la camera puis relance.';
            }
        }
    }

    setupAutoCleanup() {
        const container = document.getElementById('container');
        if (!container) {
            return;
        }

        const observer = new MutationObserver(() => {
            if (!document.getElementById('qr-video')) {
                this.destroyCamera();
                observer.disconnect();
            }
        });

        observer.observe(container, { childList: true, subtree: true });
    }

    handleQrResult(result) {
        const value = (typeof result === 'string' ? result : result?.data || '').trim();
        if (!value) {
            return;
        }

        const now = Date.now();
        if (value === this.lastScannedValue && (now - this.lastScanAt) < 1500) {
            return;
        }

        this.lastScannedValue = value;
        this.lastScanAt = now;

        const input = document.getElementById('scan-input');
        if (input) {
            input.value = value;
        }

        this.processScan(value);
    }

    async startCamera() {
        if (!this.qrScanner) {
            return;
        }

        const cameraStatus = document.getElementById('camera-status');

        await this.qrScanner.start();
        if (cameraStatus) {
            cameraStatus.textContent = 'Camera active: presente la carte QR.';
        }
    }

    async stopCamera() {
        if (!this.qrScanner) {
            return;
        }

        const cameraStatus = document.getElementById('camera-status');

        this.qrScanner.stop();
        if (cameraStatus) {
            cameraStatus.textContent = 'Camera arretee.';
        }
    }

    destroyCamera() {
        if (!this.qrScanner) {
            return;
        }

        this.qrScanner.stop();
        this.qrScanner.destroy();
        this.qrScanner = null;
    }

    playFeedbackSound(type = 'success') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return;
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        if (type === 'error') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(320, now);
            oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.14);
            gainNode.gain.setValueAtTime(0.0001, now);
            gainNode.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(920, now);
            gainNode.gain.setValueAtTime(0.0001, now);
            gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        }

        const duration = type === 'error' ? 0.16 : 0.1;

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);
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
                this.playFeedbackSound('success');
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
                this.playFeedbackSound('error');
                this.view.displayMessage(response.message || 'Erreur lors du scan', true);
            }
        } catch (error) {
            this.playFeedbackSound('error');
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

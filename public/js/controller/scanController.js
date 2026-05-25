import ScanView from "../view/scanView.js";
import MovementsModel from "../model/movementsModel.js";
import api from "../api.js";
import QrScanner from "../vendor/qr-scanner.min.js";

/**
 * Contrôleur du scanner de cartes QR.
 * Gère la saisie manuelle, la caméra QR et le traitement des scans via l'API.
 */
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

    /**
     * Charge la page du scanner et initialise les écouteurs et la caméra.
     */
    loadScan() {
        this.view.render(() => {
            this.attachEventListeners();
            this.initQrScanner();
            this.setupAutoCleanup();
            this.focusHiddenInput();
        });
    }

    /**
     * Attache les écouteurs d'événements sur le champ de saisie caché et le switch caméra.
     */
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
            scanInput.addEventListener('blur', () => {
                window.setTimeout(() => this.focusHiddenInput(), 0);
            });
        }

        const cameraToggle = document.getElementById('camera-toggle');
        if (cameraToggle) {
            cameraToggle.addEventListener('change', async () => {
                if (cameraToggle.checked) {
                    await this.startCamera();
                } else {
                    await this.stopCamera();
                }
            });
        }
    }

    /**
     * Initialise le scanner QR sur l'élément vidéo et démarre automatiquement la caméra si disponible.
     * @returns {Promise<void>}
     */
    async initQrScanner() {
        const video = document.getElementById('qr-video');
        const cameraStatus = document.getElementById('camera-status');
        const cameraToggle = document.getElementById('camera-toggle');

        if (!video) {
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateCameraToggleState(false);
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
            if (cameraToggle) {
                cameraToggle.checked = false;
            }
            this.updateCameraToggleState(false);
            this.view.displayMessage('Impossible de demarrer la camera.', true);
            if (cameraStatus) {
                cameraStatus.textContent = 'Autorise la camera puis relance.';
            }
        }
    }

    /**
     * Observe le DOM pour détruire la caméra automatiquement lorsque la vue est démontée.
     */
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

    /**
     * Gère le résultat détecté par le scanner QR, avec anti-doublons (délai 1,5 s).
     * @param {string|Object} result - Résultat brut du scanner (string ou {data: string})
     */
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

    focusHiddenInput() {
        const input = document.getElementById('scan-input');
        if (input) {
            input.focus({ preventScroll: true });
        }
    }

    updateCameraToggleState(isOn) {
        const toggle = document.getElementById('camera-toggle');
        const label = document.getElementById('camera-toggle-label');

        if (toggle) {
            toggle.checked = isOn;
        }

        if (label) {
            label.textContent = isOn ? 'Camera allumee' : 'Camera eteinte';
        }
    }

    /**
     * Démarre la caméra QR.
     * @returns {Promise<void>}
     */
    async startCamera() {
        if (!this.qrScanner) {
            return;
        }

        const cameraStatus = document.getElementById('camera-status');

        await this.qrScanner.start();
        this.updateCameraToggleState(true);
        if (cameraStatus) {
            cameraStatus.textContent = 'Camera active: presente la carte QR.';
        }
        this.focusHiddenInput();
    }

    /**
     * Stoppe la caméra QR sans la détruire.
     * @returns {Promise<void>}
     */
    async stopCamera() {
        if (!this.qrScanner) {
            return;
        }

        const cameraStatus = document.getElementById('camera-status');

        this.qrScanner.stop();
        this.updateCameraToggleState(false);
        if (cameraStatus) {
            cameraStatus.textContent = 'Camera arretee.';
        }
    }

    /**
     * Stoppe et libère les ressources du scanner QR.
     */
    destroyCamera() {
        if (!this.qrScanner) {
            return;
        }

        this.qrScanner.stop();
        this.qrScanner.destroy();
        this.qrScanner = null;
    }

    /**
     * Joue un son de retour sonore selon le type de résultat.
     * Succès : double bip montant (1250 → 1520 Hz). Échec : double bip descendant (1250 → 800 Hz).
     * @param {'success'|'error'} [type='success'] - Type de son
     */
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

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const createTone = (frequency, startAt, duration, peakGain, wave = 'sine', endFrequency = null) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = wave;
            oscillator.frequency.setValueAtTime(frequency, startAt);
            if (endFrequency) {
                oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
            }

            gainNode.gain.setValueAtTime(0.0001, startAt);
            gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(startAt);
            oscillator.stop(startAt + duration + 0.01);
        };

        if (type === 'error') {
            // Son refuse: double bip descendant 1250 Hz -> 800 Hz.
            createTone(1250, now, 0.07, 0.55, 'square');
            createTone(800, now + 0.1, 0.075, 0.5, 'square');
        } else {
            // Son succes style scanner: double bip aigu rapide et net (grave -> aigu).
            createTone(1250, now, 0.07, 0.5, 'square');
            createTone(1520, now + 0.1, 0.075, 0.55, 'square');
        }
    }

    addMovement(movementData) {
        this.model.addMovement(movementData);
    }

    /**
     * Traite un scan (saisie manuelle ou QR) : appelle l'API, joue le son et met à jour la vue.
     * Un verrou empêche les doubles appels simultanés.
     * @param {string} sourcedId - Identifiant externe de la carte étudiant
     * @returns {Promise<void>}
     */
    async processScan(sourcedId) {
        if (!sourcedId) {
            this.view.displayMessage('ID étudiant requis', true);
            return;
        }

        // Bloquer les appels simultanés (double Enter, Enter + bouton, etc.)
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const inferredStudent = await api.resolveStudentBySourcedId(sourcedId);
            if (inferredStudent?.id_etudiant) {
                await api.registerDailyPresence({
                    studentId: inferredStudent.id_etudiant,
                    classe: inferredStudent.classe || '',
                    nom: inferredStudent.nom || '',
                    prenom: inferredStudent.prenom || '',
                    statut: 'Présent',
                    typePassage: 'Entrée matin'
                });
            }

            // Le backend détermine automatiquement type_passage et statut
            const response = await api.scanStudent(sourcedId);

            if (response.success) {
                const STATUT_ROUGE = ['Absent', 'Refusé', 'En retard'];
                const soundType = STATUT_ROUGE.includes(response.statut) ? 'error' : 'success';
                this.playFeedbackSound(soundType);
                const student = response.student;
                this.view.renderNewScan(
                    `${student.prenom} ${student.nom}`,
                    student.classe || '---',
                    response.type_label,
                    response.statut,
                    response.statut_label
                );

                await api.registerDailyPresence({
                    studentId: student.id,
                    classe: student.classe || '',
                    nom: student.nom || '',
                    prenom: student.prenom || '',
                    statut: response.statut || '',
                    typePassage: response.type_passage || ''
                });

                // Emploi du temps du jour par classe
                const jour = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
                const scheduleResponse = await api.getScheduleByClass(student.classe || 'default', jour);
                if (scheduleResponse.success) {
                    this.view.displaySchedule(scheduleResponse.schedule);
                } else {
                    this.view.displaySchedule([]);
                }
            } else if (response.queued) {
                this.playFeedbackSound('success');
                this.view.displayMessage(response.message || 'Scan mis en attente locale pour synchronisation automatique.', false);
            } else {
                this.playFeedbackSound('error');
                this.view.displayMessage(response.message || 'Erreur lors du scan', true);
            }
        } catch (error) {
            this.playFeedbackSound('error');
            this.view.displayMessage('Erreur: ' + error.message, true);
            console.error('Erreur:', error);
        } finally {
            const input = document.getElementById('scan-input');
            if (input) {
                input.value = '';
            }
            this.focusHiddenInput();

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

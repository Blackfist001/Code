/**
 * Sous-contrôleur de gestion des paramètres applicatifs.
 */
export default class ManagementSettingsController {
    constructor(parent, api) {
        this.parent = parent;
        this.api = api;
        this._currentSettings = {};
    }

    async loadSettings() {
        try {
            const [settingsResponse, backupsResponse, slotsResponse, matieresResponse] = await Promise.all([
                this.api.getSettings(),
                this.api.getSettingsBackups(),
                this.api.getScheduleSlots(),
                this.api.getAllMatieres(),
            ]);

            const payload = settingsResponse?.success ? (settingsResponse.results || {}) : {};
            const backups = backupsResponse?.success ? (backupsResponse.results || []) : [];
            const slots = slotsResponse?.success ? (slotsResponse.results || {}) : { debut: [], fin: [] };
            const loadedMatieres = matieresResponse?.success ? (matieresResponse.results || []) : [];

            if (!payload.midi_matiere_id && Array.isArray(loadedMatieres)) {
                const midiMatiere = loadedMatieres.find(item => String(item?.matiere || '').trim().toUpperCase() === 'MIDI');
                if (midiMatiere?.id_matiere) {
                    payload.midi_matiere_id = String(midiMatiere.id_matiere);
                }
            }

            if (typeof this.parent.view?.setScheduleMatieres === 'function') {
                this.parent.view.setScheduleMatieres(loadedMatieres);
            }

            this._currentSettings = payload;
            this.parent.view.displaySettings(payload, backups, slots);
        } catch (error) {
            this.parent.view.settingsView?.notify('Impossible de charger les paramètres.', 'error');
            this.parent.view.displaySettings({}, [], { debut: [], fin: [] });
        }
    }

    async saveSettingsWithSlotProposal(settingsData) {
        const previousDuration = Number(this._currentSettings?.course_duration_min ?? 50);
        const nextDuration = Number(settingsData?.course_duration_min ?? previousDuration);
        const previousBreakDuration = Number(this._currentSettings?.morning_break_duration_min ?? 15);
        const nextBreakDuration = Number(settingsData?.morning_break_duration_min ?? previousBreakDuration);
        const hasCourseDurationChanged = previousDuration !== nextDuration;
        const hasBreakDurationChanged = previousBreakDuration !== nextBreakDuration;
        const hasScheduleImpactChange = hasCourseDurationChanged || hasBreakDurationChanged;

        let shouldAutoUpdateSlots = false;
        let slotProposal = null;
        let payloadToSave = { ...(settingsData || {}) };
        let applyResult = null;

        if (hasScheduleImpactChange) {
            try {
                const slotsResponse = await this.api.getScheduleSlots();
                const slots = slotsResponse?.success ? (slotsResponse.results || {}) : { debut: [], fin: [] };
                slotProposal = this._buildSlotProposal(slots, previousDuration, nextDuration, payloadToSave);

                const decision = await this.parent.view.settingsView?.showDurationChangeModal({
                    previousDuration,
                    nextDuration,
                    previousBreakDuration,
                    nextBreakDuration,
                    hasCourseDurationChanged,
                    hasBreakDurationChanged,
                    proposal: slotProposal,
                });

                if (!decision?.confirmed) {
                    return;
                }

                shouldAutoUpdateSlots = Boolean(decision.applyAutoSlots && slotProposal?.canAutoApply);

                if (decision.applyAutoSlots && !slotProposal?.canAutoApply) {
                    this.parent.view.settingsView?.notify(
                        'Mise à jour automatique des créneaux impossible (liste incomplète). Les paramètres ont été enregistrés uniquement.',
                        'warning'
                    );
                }
            } catch (_) {
                this.parent.view.settingsView?.notify(
                    'Impossible de préparer la simulation des créneaux. Enregistrement des paramètres seulement.',
                    'warning'
                );
            }
        }

        if (shouldAutoUpdateSlots && slotProposal?.canAutoApply) {
            applyResult = await this._applySlotProposal(slotProposal);
            if (applyResult.success) {
                payloadToSave = this._applyAutoCalculatedTimeSettings(payloadToSave, slotProposal);
            }
        }

        const settingsSaved = await this.updateSettings(payloadToSave);
        if (!settingsSaved) {
            return;
        }

        if (shouldAutoUpdateSlots && slotProposal?.canAutoApply) {
            if (applyResult?.success) {
                this.parent.view.settingsView?.notify('Créneaux recalculés et enregistrés automatiquement.', 'success');
                await this.parent.loadScheduleSlots();
                this.parent.view.displaySlots();
                this.parent.view.schedulesView.updateSlotOptions();
                await this.parent.view.slotsView?.showBulkUpdatePreview(slotProposal.rows, nextDuration);
            } else {
                this.parent.view.settingsView?.notify(
                    'Paramètres enregistrés, mais certains créneaux n\'ont pas pu être mis à jour automatiquement.',
                    'warning'
                );
                await this.parent.view.settingsView?.showSlotUpdateFailureDetails(applyResult.failures || []);
            }
        } else if (hasScheduleImpactChange) {
            this.parent.view.settingsView?.notify(
                'Paramètre horaire modifié sans recalcul automatique des créneaux. Pense à les adapter manuellement.',
                'warning'
            );
        }
    }

    async updateSettings(settingsData) {
        try {
            const response = await this.api.updateSettings(settingsData);
            if (!response?.success) {
                this.parent.view.settingsView?.notify(response?.message || 'Erreur lors de l\'enregistrement.', 'error');
                return false;
            }

            this._currentSettings = response.results || settingsData || {};
            this.parent.view.settingsView?.notify(response.message || 'Paramètres enregistrés.', 'success');
            await this.loadSettings();
            return true;
        } catch (_) {
            this.parent.view.settingsView?.notify('Erreur lors de l\'enregistrement des paramètres.', 'error');
            return false;
        }
    }

    _toMinutes(hhmm) {
        const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(hhmm || ''));
        if (!match) return null;
        return (parseInt(match[1], 10) * 60) + parseInt(match[2], 10);
    }

    _toHHMM(totalMinutes) {
        const minutes = ((Number(totalMinutes) % (24 * 60)) + (24 * 60)) % (24 * 60);
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    _sortSlotsByTime(slots = []) {
        return [...(Array.isArray(slots) ? slots : [])].sort((a, b) => {
            const am = this._toMinutes(String(a?.creneau || ''));
            const bm = this._toMinutes(String(b?.creneau || ''));
            return (am ?? 0) - (bm ?? 0);
        });
    }

    _buildSlotProposal(slotsPayload, previousDurationMin, nextDurationMin, settingsData = {}) {
        const startSlots = this._sortSlotsByTime(slotsPayload?.debut || []);
        const endSlots = this._sortSlotsByTime(slotsPayload?.fin || []);
        const previousDuration = Math.max(1, Number(previousDurationMin) || 50);
        const nextDuration = Math.max(1, Number(nextDurationMin) || previousDuration);
        const morningBreakDuration = Math.max(0, Number(settingsData?.morning_break_duration_min) || 0);
        const configuredBreakTime = this._toMinutes(String(settingsData?.morning_break_time || ''));

        if (!startSlots.length || !endSlots.length) {
            return {
                canAutoApply: false,
                reason: 'Aucun créneau début/fin disponible.',
                rows: [],
                startSlots: [],
                endSlots: [],
            };
        }

        const count = Math.min(startSlots.length, endSlots.length);
        const earliestStartMin = startSlots.reduce((min, slot) => {
            const value = this._toMinutes(String(slot?.creneau || ''));
            if (value === null) {
                return min;
            }
            return min === null ? value : Math.min(min, value);
        }, null);

        if (earliestStartMin === null) {
            return {
                canAutoApply: false,
                reason: 'Impossible de lire le premier créneau début.',
                rows: [],
                startSlots,
                endSlots,
            };
        }

        const rows = [];
        let currentStartMin = earliestStartMin;
        let computedBreakStartMin = null;
        let computedBreakEndMin = null;

        for (let i = 0; i < count; i += 1) {
            const oldStartMin = this._toMinutes(String(startSlots[i]?.creneau || ''));
            const oldEndMin = this._toMinutes(String(endSlots[i]?.creneau || ''));
            if (oldStartMin === null || oldEndMin === null) {
                continue;
            }

            const newStartMin = i === 0 ? earliestStartMin : currentStartMin;
            const newEndMin = newStartMin + nextDuration;

            if (i === 1) {
                computedBreakStartMin = newEndMin;
                computedBreakEndMin = newEndMin + morningBreakDuration;
                currentStartMin = computedBreakEndMin;
            } else {
                currentStartMin = newEndMin;
            }

            rows.push({
                startId: startSlots[i].id_creneau,
                endId: endSlots[i].id_creneau,
                oldStart: String(startSlots[i].creneau || '').substring(0, 5),
                oldEnd: String(endSlots[i].creneau || '').substring(0, 5),
                newStart: this._toHHMM(newStartMin),
                newEnd: this._toHHMM(newEndMin),
            });
        }

        const canAutoApply = rows.length > 0;
        const reasons = [];
        if (startSlots.length !== endSlots.length) {
            reasons.push('Le nombre de créneaux début et fin est différent: application sur les paires existantes uniquement.');
        }
        if (computedBreakStartMin !== null && configuredBreakTime !== null && computedBreakStartMin !== configuredBreakTime) {
            reasons.push(`La récréation calculée débute à ${this._toHHMM(computedBreakStartMin)} (heure configurée: ${this._toHHMM(configuredBreakTime)}).`);
        }

        return {
            canAutoApply,
            reason: reasons.join(' '),
            rows,
            startSlots,
            endSlots,
            computedBreakStart: computedBreakStartMin !== null ? this._toHHMM(computedBreakStartMin) : null,
            computedBreakEnd: computedBreakEndMin !== null ? this._toHHMM(computedBreakEndMin) : null,
        };
    }

    _applyAutoCalculatedTimeSettings(settingsData = {}, proposal = {}) {
        const translate = (value) => this._translateTimeWithProposal(proposal, value);

        return {
            ...settingsData,
            morning_break_time: proposal?.computedBreakStart || translate(settingsData?.morning_break_time),
            midi1_start: translate(settingsData?.midi1_start),
            midi1_end: translate(settingsData?.midi1_end),
            midi2_start: translate(settingsData?.midi2_start),
            midi2_end: translate(settingsData?.midi2_end),
        };
    }

    _translateTimeWithProposal(proposal = {}, value = '') {
        const normalized = String(value || '').substring(0, 5);
        if (!normalized) {
            return normalized;
        }

        const rows = Array.isArray(proposal?.rows) ? proposal.rows : [];
        for (const row of rows) {
            if (row?.oldStart === normalized) {
                return row.newStart;
            }
            if (row?.oldEnd === normalized) {
                return row.newEnd;
            }
        }

        return normalized;
    }

    async _applySlotProposal(proposal) {
        const failures = [];
        let slotsSnapshot = null;

        const loadSlotsSnapshot = async () => {
            if (slotsSnapshot) {
                return slotsSnapshot;
            }
            try {
                const response = await this.api.getScheduleSlots();
                slotsSnapshot = response?.success ? (response.results || { debut: [], fin: [] }) : { debut: [], fin: [] };
            } catch (_) {
                slotsSnapshot = { debut: [], fin: [] };
            }
            return slotsSnapshot;
        };

        const resolveFailureReason = async ({ type, id, oldTime, newTime, responseMessage }) => {
            const slots = await loadSlotsSnapshot();
            const list = Array.isArray(slots?.[type]) ? slots[type] : [];
            const normalizedTarget = String(newTime || '').substring(0, 5);
            const byId = list.find(s => String(s?.id_creneau) === String(id));
            const current = String(byId?.creneau || '').substring(0, 5);
            const collision = list.find(s => String(s?.id_creneau) !== String(id) && String(s?.creneau || '').substring(0, 5) === normalizedTarget);

            if (!byId) {
                return `Créneau introuvable (id ${id}).`;
            }
            if (current === normalizedTarget) {
                return `Aucune modification nécessaire (${normalizedTarget} déjà enregistré).`;
            }
            if (collision) {
                return `Conflit: ${normalizedTarget} existe déjà dans les créneaux ${type}.`;
            }
            if (responseMessage) {
                return responseMessage;
            }

            return `Échec de mise à jour ${type} (${oldTime} -> ${normalizedTarget}).`;
        };

        for (const row of proposal.rows || []) {
            if (row.oldStart !== row.newStart) {
                let startRes;
                try {
                    startRes = await this.api.updateScheduleSlot(row.startId, { type: 'debut', creneau: row.newStart });
                } catch (error) {
                    startRes = { success: false, message: error?.message || 'Erreur réseau/API' };
                }

                if (!startRes?.success) {
                    const reason = await resolveFailureReason({
                        type: 'debut',
                        id: row.startId,
                        oldTime: row.oldStart,
                        newTime: row.newStart,
                        responseMessage: startRes?.message,
                    });

                    if (!reason.startsWith('Aucune modification nécessaire')) {
                        failures.push({
                            slotType: 'Début',
                            slotId: row.startId,
                            from: row.oldStart,
                            to: row.newStart,
                            reason,
                        });
                    }
                }
            }

            if (row.oldEnd !== row.newEnd) {
                let endRes;
                try {
                    endRes = await this.api.updateScheduleSlot(row.endId, { type: 'fin', creneau: row.newEnd });
                } catch (error) {
                    endRes = { success: false, message: error?.message || 'Erreur réseau/API' };
                }

                if (!endRes?.success) {
                    const reason = await resolveFailureReason({
                        type: 'fin',
                        id: row.endId,
                        oldTime: row.oldEnd,
                        newTime: row.newEnd,
                        responseMessage: endRes?.message,
                    });

                    if (!reason.startsWith('Aucune modification nécessaire')) {
                        failures.push({
                            slotType: 'Fin',
                            slotId: row.endId,
                            from: row.oldEnd,
                            to: row.newEnd,
                            reason,
                        });
                    }
                }
            }
        }

        return {
            success: failures.length === 0,
            failures,
        };
    }
}

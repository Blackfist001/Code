export default class ManagementSettingsView {
    constructor(parent) {
        this.parent = parent;
        this._backupsById = new Map();
    }

    notify(message, type = 'info') {
        if (message && window.AppNotifier && typeof window.AppNotifier.notify === 'function') {
            window.AppNotifier.notify(message, type);
            return;
        }
        alert(message);
    }

    bindEvents(controller) {
        const saveBtn = document.getElementById('btn-settings-save');
        const reloadBtn = document.getElementById('btn-settings-reload');
        const backupSelect = document.getElementById('settings-backup-select');
        const midi1StartSelect = document.getElementById('settings-midi1-start');
        const midi2EndSelect = document.getElementById('settings-midi2-end');

        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => controller.loadSettings());
        }

        const syncDerivedEntries = () => this._syncDerivedEntryBounds();
        if (midi1StartSelect) {
            midi1StartSelect.addEventListener('change', syncDerivedEntries);
        }
        if (midi2EndSelect) {
            midi2EndSelect.addEventListener('change', syncDerivedEntries);
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const payload = this._collectFormValues();
                const coherence = this._validateCoherence(payload);
                if (!coherence.valid) {
                    const html = `<ul style="text-align:left;margin:0;padding-left:20px;">${coherence.issues.map(i => `<li>${i}</li>`).join('')}</ul>`;
                    if (window.Swal && typeof window.Swal.fire === 'function') {
                        await window.Swal.fire({
                            icon: 'warning',
                            title: 'Incohérence détectée',
                            html,
                            confirmButtonText: 'Corriger',
                        });
                    } else {
                        alert(coherence.issues.join('\n'));
                    }
                    return;
                }

                controller.saveSettingsWithSlotProposal(payload);
            });
        }

        if (backupSelect) {
            backupSelect.addEventListener('change', async () => {
                const backupId = String(backupSelect.value || '');
                if (backupId === '' || !this._backupsById.has(backupId)) {
                    return;
                }

                const selected = this._backupsById.get(backupId);
                if (selected?.settings) {
                    const decision = await this._showBackupComparisonModal(
                        this._collectFormValues(),
                        selected.settings,
                        selected.modified_at || 'Date inconnue',
                        selected.tracked_changes || {}
                    );
                    if (!decision?.confirmed) {
                        backupSelect.value = '';
                        return;
                    }

                    this._applySettingsToForm(selected.settings);
                    controller.updateSettings(selected.settings);
                }
            });
        }
    }

    /**
     * @param {Object} settings
     * @param {Array} backups
     * @param {Object} slots
     */
    displaySettings(settings = {}, backups = [], slots = { debut: [], fin: [] }) {
        this._slotsSnapshot = slots;
        this._renderMorningBreakTimeOptions(slots, settings?.morning_break_time ?? '09:55');
        this._renderMidiTimeOptions(slots, {
            midi1Start: settings?.midi1_start ?? '11:50',
            midi1End: settings?.midi1_end ?? '12:40',
            midi2Start: settings?.midi2_start ?? '12:40',
            midi2End: settings?.midi2_end ?? '13:30',
        });
        this._applySettingsToForm(settings);
        this._syncDerivedEntryBounds();
        this._renderBackups(backups);
    }

    async showDurationChangeModal({
        previousDuration,
        nextDuration,
        previousBreakDuration,
        nextBreakDuration,
        hasCourseDurationChanged,
        hasBreakDurationChanged,
        proposal,
    }) {
        const rows = Array.isArray(proposal?.rows) ? proposal.rows : [];
        const infoReason = proposal?.reason ? `<p style="margin:.4rem 0 0;color:#d97706;">${proposal.reason}</p>` : '';
        const changeTitle = hasCourseDurationChanged && hasBreakDurationChanged
            ? 'Durée de cours et récréation modifiées'
            : (hasBreakDurationChanged ? 'Durée de récréation modifiée' : 'Durée de cours modifiée');
        const details = [
            `Durée cours : <b>${previousDuration} min</b> -> <b>${nextDuration} min</b>`,
            `Durée récréation : <b>${previousBreakDuration} min</b> -> <b>${nextBreakDuration} min</b>`,
        ];

        const tableHtml = rows.length
            ? `
                <div style="max-height:260px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;">
                    <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Début actuel</th>
                                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Fin actuelle</th>
                                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Nouveau début</th>
                                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Nouvelle fin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `
                                <tr>
                                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${r.oldStart}</td>
                                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${r.oldEnd}</td>
                                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#0f766e;font-weight:600;">${r.newStart}</td>
                                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#0f766e;font-weight:600;">${r.newEnd}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            : '<p style="margin:0;color:#b45309;">Aucune paire de créneaux exploitable pour une mise à jour automatique.</p>';

        if (window.Swal && typeof window.Swal.fire === 'function') {
            const result = await window.Swal.fire({
                icon: 'question',
                title: changeTitle,
                html: `
                    <p style="text-align:left;margin:0 0 .6rem 0;">${details.join('<br>')}</p>
                    <p style="text-align:left;margin:0 0 .6rem 0;">Proposition de recalcul automatique : le premier créneau de début reste inchangé, puis les cours s'enchaînent avec la nouvelle durée. La récréation du matin est insérée après le 2e cours selon les paramètres définis.</p>
                    ${tableHtml}
                    ${infoReason}
                    <label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;text-align:left;">
                        <input id="settings-no-auto-slots" type="checkbox" style="margin-top:3px;">
                        <span>Ne pas modifier automatiquement les créneaux (je les modifierai manuellement).</span>
                    </label>
                `,
                showCancelButton: true,
                confirmButtonText: 'Confirmer',
                cancelButtonText: 'Annuler',
                preConfirm: () => {
                    const noAuto = document.getElementById('settings-no-auto-slots');
                    return {
                        applyAutoSlots: !(noAuto && noAuto.checked),
                    };
                },
            });

            if (!result.isConfirmed) {
                return { confirmed: false, applyAutoSlots: false };
            }

            const applyAutoSlots = Boolean(result.value?.applyAutoSlots);
            if (!applyAutoSlots) {
                this.notify(
                    'Les créneaux ne seront pas recalculés automatiquement. Pense à les adapter manuellement dans Gestion > Créneaux.',
                    'warning'
                );
            }

            return {
                confirmed: true,
                applyAutoSlots,
            };
        }

        const confirmed = window.confirm(
            `Durée de cours: ${previousDuration} -> ${nextDuration} minutes.\n` +
            'Souhaitez-vous aussi recalculer automatiquement les créneaux ?'
        );

        if (!confirmed) {
            return { confirmed: false, applyAutoSlots: false };
        }

        return { confirmed: true, applyAutoSlots: true };
    }

    async showSlotUpdateFailureDetails(failures = []) {
        const rows = Array.isArray(failures) ? failures : [];
        if (!rows.length) {
            return;
        }

        const html = `
            <p style="text-align:left;margin:0 0 .75rem 0;">Certaines mises à jour automatiques n'ont pas pu être appliquées.</p>
            <div style="max-height:300px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;">
                <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Type</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">ID</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Ancien</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Nouveau</th>
                            <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Raison</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(item => `
                            <tr>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${item.slotType || '-'}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${item.slotId || '-'}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${item.from || '-'}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${item.to || '-'}</td>
                                <td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#b42318;">${item.reason || 'Raison non disponible'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (window.Swal && typeof window.Swal.fire === 'function') {
            await window.Swal.fire({
                icon: 'warning',
                title: 'Détails des créneaux non sauvegardés',
                html,
                confirmButtonText: 'Fermer',
                width: 980,
            });
            return;
        }

        alert('Certaines mises à jour de créneaux ont échoué.');
    }

    _applySettingsToForm(settings = {}) {
        this._setValue('settings-course-duration-min', settings.course_duration_min ?? 50);
        this._setValue('settings-late-tolerance-min', settings.late_tolerance_min ?? 5);
        this._setValue('settings-morning-break-duration-min', settings.morning_break_duration_min ?? 15);
        this._setValue('settings-morning-break-time', settings.morning_break_time ?? '09:55');
        this._setValueFromOptions('settings-midi1-start', settings.midi1_start ?? '11:50');
        this._setValueFromOptions('settings-midi1-end', settings.midi1_end ?? '12:40');
        this._setValueFromOptions('settings-midi2-start', settings.midi2_start ?? '12:40');
        this._setValueFromOptions('settings-midi2-end', settings.midi2_end ?? '13:30');
        this._setValue('settings-midi1-years', settings.midi1_years ?? '1,2');
        this._setValue('settings-midi2-years', settings.midi2_years ?? '3,4,5,6,7,8');
        this._setValue('settings-morning-entry-end', settings.morning_entry_end ?? '11:49');
        this._setValue('settings-afternoon-entry-start', settings.afternoon_entry_start ?? '13:31');
        this._syncDerivedEntryBounds();
    }

    _syncDerivedEntryBounds() {
        const midi1StartMin = this._toMinutes(this._getValue('settings-midi1-start', ''));
        if (midi1StartMin !== null) {
            this._setValue('settings-morning-entry-end', this._toHHMM(midi1StartMin - 1));
        }

        const midi2EndMin = this._toMinutes(this._getValue('settings-midi2-end', ''));
        if (midi2EndMin !== null) {
            this._setValue('settings-afternoon-entry-start', this._toHHMM(midi2EndMin + 1));
        }
    }

    async _showBackupComparisonModal(currentSettings = {}, backupSettings = {}, modifiedAt = '', trackedChanges = {}) {
        const fields = [
            ['course_duration_min', "Durée d'un cours"],
            ['late_tolerance_min', 'Battement retard'],
            ['morning_break_duration_min', 'Récréation du matin'],
            ['morning_break_time', 'Heure de récréation'],
            ['midi1_start', 'Midi 1 - Début'],
            ['midi1_end', 'Midi 1 - Fin'],
            ['midi2_start', 'Midi 2 - Début'],
            ['midi2_end', 'Midi 2 - Fin'],
            ['midi1_years', 'Midi 1 - Années'],
            ['midi2_years', 'Midi 2 - Années'],
            ['morning_entry_end', "Entrée matin jusqu'à"],
            ['afternoon_entry_start', "Entrée après-midi à partir de"],
        ];

        const renderColumn = (title, source, compareTo) => `
            <div style="flex:1;min-width:250px;border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fff;">
                <h4 style="margin:0 0 10px 0;color:#2c3e50;">${title}</h4>
                <div style="display:grid;gap:8px;">
                    ${fields.map(([key, label]) => {
                        const value = String(source?.[key] ?? '---');
                        const other = String(compareTo?.[key] ?? '---');
                        const changed = value !== other;
                        return `
                            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #f1f5f9;padding:6px 8px;border-radius:8px;background:${changed ? '#fdecec' : 'transparent'};">
                                <span style="color:#5d6d7e;">${label}</span>
                                <strong style="color:#1f2937;text-align:right;">${value}</strong>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const trackedLabels = {
            morning_break_duration_min: 'Récréation du matin (durée)',
            morning_break_time: 'Heure de récréation',
            midi1_start: 'Midi 1 - Début',
            midi1_end: 'Midi 1 - Fin',
            midi2_start: 'Midi 2 - Début',
            midi2_end: 'Midi 2 - Fin',
            morning_entry_end: "Entrée matin jusqu'à",
            afternoon_entry_start: "Entrée après-midi à partir de",
        };

        const trackedRows = Object.entries(trackedChanges || {})
            .filter(([key, value]) => trackedLabels[key] && value && typeof value === 'object')
            .map(([key, value]) => {
                const oldValue = String(value.old ?? '---');
                const newValue = String(value.new ?? '---');
                return `
                    <tr>
                        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${trackedLabels[key]}</td>
                        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${oldValue}</td>
                        <td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#b42318;font-weight:600;">${newValue}</td>
                    </tr>
                `;
            });

        const trackedSection = trackedRows.length
            ? `
                <div style="margin-top:14px;text-align:left;">
                    <h4 style="margin:0 0 8px 0;color:#2c3e50;">Modifications tracées (ancien -> nouveau)</h4>
                    <div style="max-height:220px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;">
                        <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Champ</th>
                                    <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Ancien</th>
                                    <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;">Nouveau</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trackedRows.join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `
            : '';

        const html = `
            <p style="text-align:left;margin:0 0 12px 0;color:#5d6d7e;">Sauvegarde sélectionnée : <b>${modifiedAt}</b></p>
            <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:stretch;">
                ${renderColumn('Avant', currentSettings, backupSettings)}
                ${renderColumn('Après', backupSettings, currentSettings)}
            </div>
            ${trackedSection}
            <p style="text-align:left;margin:12px 0 0;color:#c0392b;font-size:.92rem;">Les valeurs non équivalentes sont mises en rouge.</p>
        `;

        if (window.Swal && typeof window.Swal.fire === 'function') {
            const result = await window.Swal.fire({
                icon: 'info',
                title: 'Comparaison de sauvegarde',
                html,
                showCancelButton: true,
                confirmButtonText: 'Confirmer la restauration',
                cancelButtonText: 'Annuler',
                width: 980,
            });
            return { confirmed: !!result.isConfirmed };
        }

        const confirmed = window.confirm(`Appliquer la sauvegarde du ${modifiedAt} ?`);
        return { confirmed };
    }

    _renderBackups(backups = []) {
        const backupSelect = document.getElementById('settings-backup-select');
        if (!backupSelect) {
            return;
        }

        this._backupsById = new Map();
        const options = ['<option value="">-- Aucune sauvegarde --</option>'];

        (Array.isArray(backups) ? backups : []).forEach((entry, index) => {
            const id = String(entry?.id || `backup-${index}`);
            const modifiedAt = String(entry?.modified_at || 'Date inconnue');
            this._backupsById.set(id, entry);
            options.push(`<option value="${id}">${modifiedAt}</option>`);
        });

        backupSelect.innerHTML = options.join('');
        backupSelect.value = '';
    }

    _setValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = String(value ?? '');
        }
    }

    _setValueFromOptions(id, value) {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }

        const normalized = String(value ?? '').substring(0, 5);
        el.value = Array.from(el.options || []).some(opt => opt.value === normalized) ? normalized : '';
    }

    _renderMorningBreakTimeOptions(slots = { fin: [] }, selectedValue = '09:55') {
        const select = document.getElementById('settings-morning-break-time');
        if (!select) {
            return;
        }

        const finSlots = Array.isArray(slots?.fin) ? slots.fin : [];
        const values = Array.from(new Set(finSlots
            .map(slot => String(slot?.creneau || '').substring(0, 5))
            .filter(v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v))
        )).sort((a, b) => this._toMinutes(a) - this._toMinutes(b));

        const normalizedSelected = String(selectedValue || '').substring(0, 5);

        const options = ['<option value="">-- Choisir un créneau --</option>'];
        values.forEach(v => {
            options.push(`<option value="${v}">${v}</option>`);
        });

        select.innerHTML = options.join('');
        select.value = values.includes(normalizedSelected) ? normalizedSelected : '';
    }

    _renderMidiTimeOptions(slots = { debut: [], fin: [] }, selected = {}) {
        const startSlots = Array.isArray(slots?.debut) ? slots.debut : [];
        const endSlots = Array.isArray(slots?.fin) ? slots.fin : [];

        const startValues = Array.from(new Set(startSlots
            .map(slot => String(slot?.creneau || '').substring(0, 5))
            .filter(v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v))
        )).sort((a, b) => this._toMinutes(a) - this._toMinutes(b));

        const endValues = Array.from(new Set(endSlots
            .map(slot => String(slot?.creneau || '').substring(0, 5))
            .filter(v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v))
        )).sort((a, b) => this._toMinutes(a) - this._toMinutes(b));

        const startOptionHtml = ['<option value="">-- Choisir un créneau --</option>'];
        startValues.forEach(v => {
            startOptionHtml.push(`<option value="${v}">${v}</option>`);
        });

        const endOptionHtml = ['<option value="">-- Choisir un créneau --</option>'];
        endValues.forEach(v => {
            endOptionHtml.push(`<option value="${v}">${v}</option>`);
        });

        const midi1Start = document.getElementById('settings-midi1-start');
        if (midi1Start) midi1Start.innerHTML = startOptionHtml.join('');

        const midi2Start = document.getElementById('settings-midi2-start');
        if (midi2Start) midi2Start.innerHTML = startOptionHtml.join('');

        const midi1End = document.getElementById('settings-midi1-end');
        if (midi1End) midi1End.innerHTML = endOptionHtml.join('');

        const midi2End = document.getElementById('settings-midi2-end');
        if (midi2End) midi2End.innerHTML = endOptionHtml.join('');

        this._setValueFromOptions('settings-midi1-start', selected?.midi1Start ?? '');
        this._setValueFromOptions('settings-midi1-end', selected?.midi1End ?? '');
        this._setValueFromOptions('settings-midi2-start', selected?.midi2Start ?? '');
        this._setValueFromOptions('settings-midi2-end', selected?.midi2End ?? '');
    }

    _collectFormValues() {
        return {
            course_duration_min: this._getInt('settings-course-duration-min', 50),
            late_tolerance_min: this._getInt('settings-late-tolerance-min', 5),
            morning_break_duration_min: this._getInt('settings-morning-break-duration-min', 15),
            morning_break_time: this._getValue('settings-morning-break-time', '09:55'),
            midi1_start: this._getValue('settings-midi1-start', '11:50'),
            midi1_end: this._getValue('settings-midi1-end', '12:40'),
            midi2_start: this._getValue('settings-midi2-start', '12:40'),
            midi2_end: this._getValue('settings-midi2-end', '13:30'),
            midi1_years: this._normalizeYearCsv(this._getValue('settings-midi1-years', '1,2')),
            midi2_years: this._normalizeYearCsv(this._getValue('settings-midi2-years', '3,4,5,6,7,8')),
            morning_entry_end: this._getValue('settings-morning-entry-end', '11:49'),
            afternoon_entry_start: this._getValue('settings-afternoon-entry-start', '13:31'),
        };
    }

    _getValue(id, fallback = '') {
        const el = document.getElementById(id);
        return String(el?.value || fallback).trim();
    }

    _getInt(id, fallback = 0) {
        const value = parseInt(this._getValue(id, String(fallback)), 10);
        return Number.isFinite(value) ? value : fallback;
    }

    _normalizeYearCsv(raw) {
        const years = raw
            .split(',')
            .map(v => parseInt(v.trim(), 10))
            .filter(v => Number.isInteger(v) && v >= 1 && v <= 12);

        return Array.from(new Set(years)).sort((a, b) => a - b).join(',');
    }

    _toMinutes(hhmm) {
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(hhmm)) {
            return null;
        }
        const [h, m] = hhmm.split(':');
        return Number(h) * 60 + Number(m);
    }

    _toHHMM(totalMinutes) {
        const minutes = Math.max(0, Math.min(1439, Number(totalMinutes)));
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    _parseYears(csv) {
        return csv
            .split(',')
            .map(v => parseInt(v.trim(), 10))
            .filter(v => Number.isInteger(v) && v >= 1 && v <= 12);
    }

    _validateCoherence(data) {
        const issues = [];

        if (data.course_duration_min <= 0 || data.course_duration_min > 240) {
            issues.push('La durée d\'un cours doit être comprise entre 1 et 240 minutes.');
        }

        if (data.late_tolerance_min < 0 || data.late_tolerance_min > 120) {
            issues.push('Le battement retard doit être compris entre 0 et 120 minutes.');
        }

        if (data.morning_break_duration_min < 0 || data.morning_break_duration_min > 120) {
            issues.push('La récréation du matin doit être comprise entre 0 et 120 minutes.');
        }

        const m1s = this._toMinutes(data.midi1_start);
        const m1e = this._toMinutes(data.midi1_end);
        const m2s = this._toMinutes(data.midi2_start);
        const m2e = this._toMinutes(data.midi2_end);
        const me = this._toMinutes(data.morning_entry_end);
        const as = this._toMinutes(data.afternoon_entry_start);
        const mbt = this._toMinutes(data.morning_break_time);

        if (m1s === null || m1e === null || m2s === null || m2e === null || me === null || as === null || mbt === null) {
            issues.push('Toutes les heures doivent respecter le format HH:MM.');
        } else {
            if (m1s >= m1e) {
                issues.push('Midi 1: l\'heure de début doit être strictement inférieure à l\'heure de fin.');
            }
            if (m2s >= m2e) {
                issues.push('Midi 2: l\'heure de début doit être strictement inférieure à l\'heure de fin.');
            }
            if (m1e > m2s) {
                issues.push('Midi 1 ne peut pas se terminer après le début de Midi 2.');
            }
            if (me >= as) {
                issues.push('Entrée matin doit finir avant l\'entrée après-midi.');
            }
        }

        const years1 = this._parseYears(data.midi1_years);
        const years2 = this._parseYears(data.midi2_years);

        if (!years1.length) {
            issues.push('Midi 1 doit contenir au moins une année.');
        }
        if (!years2.length) {
            issues.push('Midi 2 doit contenir au moins une année.');
        }

        const overlap = years1.filter(y => years2.includes(y));
        if (overlap.length) {
            issues.push(`Années en conflit entre Midi 1 et Midi 2: ${overlap.join(', ')}.`);
        }

        return {
            valid: issues.length === 0,
            issues,
        };
    }
}

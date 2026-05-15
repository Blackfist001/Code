const nativeAlert = window.alert.bind(window);
let swalLoadPromise = null;

/**
 * Charge SweetAlert2 depuis le CDN si non déjà disponible globalement.
 * Permet de fiabiliser l'usage de Swal dans les environnements IIS/intranet.
 * @returns {Promise<void>}
 */
async function ensureSwalLoaded() {
    if (window.Swal && typeof window.Swal.fire === 'function') {
        return;
    }

    if (swalLoadPromise) {
        return swalLoadPromise;
    }

    swalLoadPromise = (async () => {
        try {
            // Charger le CSS si absent
            const hasCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .some((link) => (link.href || '').includes('sweetalert2'));

            if (!hasCss) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
                document.head.appendChild(css);
            }

            // Import ESM depuis CDN en fallback
            const module = await import('https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm');
            const swal = module?.default ?? module?.Swal ?? null;
            if (swal && typeof swal.fire === 'function') {
                window.Swal = swal;
            }
        } catch (_e) {
            // En cas d'échec réseau CDN, on reste sur fallback alert natif.
        }
    })();

    return swalLoadPromise;
}

// Tentative de préchargement dès l'import du module.
ensureSwalLoaded();

/**
 * Détermine l'icône et le titre SweetAlert2 à utiliser selon le contenu du message.
 * @param {string} text - Texte du message
 * @returns {{icon: string, title: string}}
 */
function resolveAlertPresentation(text) {
    const normalized = String(text || '').trim().toLowerCase();

    if (
        normalized.startsWith('erreur') ||
        normalized.includes('impossible') ||
        normalized.includes('échec') ||
        normalized.includes('echec')
    ) {
        return { icon: 'error', title: 'Erreur' };
    }

    if (
        normalized.includes('obligatoire') ||
        normalized.includes('veuillez') ||
        normalized.includes('requis')
    ) {
        return { icon: 'warning', title: 'Attention' };
    }

    if (
        normalized.includes('succès') ||
        normalized.includes('succès') ||
        normalized.includes('enregistré') ||
        normalized.includes('ajouté') ||
        normalized.includes('ajoute') ||
        normalized.includes('supprimé') ||
        normalized.includes('supprime') ||
        normalized.includes('modifié') ||
        normalized.includes('modifie')
    ) {
        return { icon: 'success', title: 'Succès' };
    }

    return { icon: 'info', title: 'Information' };
}

/**
 * Remplace `window.alert` par une version utilisant SweetAlert2 (avec icône contextuelle).
 * Replie vers `window.alert` natif si SweetAlert2 n'est pas chargé.
 * @param {string} [message=''] - Texte à afficher
 */
window.alert = function alertWithSweetAlert(message = '') {
    const text = String(message ?? '');

    // Relancer le chargement en tâche de fond si Swal n'est pas encore prêt.
    if (!window.Swal) {
        ensureSwalLoaded();
    }

    if (window.Swal && typeof window.Swal.fire === 'function') {
        const presentation = resolveAlertPresentation(text);

        window.Swal.fire({
            icon: presentation.icon,
            title: presentation.title,
            text,
            confirmButtonText: 'OK',
            confirmButtonColor: presentation.icon === 'error' ? '#c0392b' : '#2c3e50'
        });
        return;
    }

    nativeAlert(text);
};

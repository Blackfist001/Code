const nativeAlert = window.alert.bind(window);

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

window.alert = function alertWithSweetAlert(message = '') {
    const text = String(message ?? '');

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

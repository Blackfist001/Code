/**
 * Affiche une boîte de dialogue de confirmation (SweetAlert2 si disponible, sinon `confirm` natif).
 * @param {string} message - Texte de confirmation
 * @param {Object} [options={}] - Options supplémentaires (icon, title, isDanger)
 * @param {string}  [options.icon='warning']        - Icône SweetAlert2
 * @param {string}  [options.title='Confirmation']  - Titre de la boîte de dialogue
 * @param {boolean} [options.isDanger=true]         - Coloration rouge du bouton de confirmation
 * @returns {Promise<boolean>} `true` si l'utilisateur confirme
 */
export async function confirmDialog(message, options = {}) {
    const text = String(message ?? '');
    const isDanger = options.isDanger !== false;

    if (window.Swal && typeof window.Swal.fire === 'function') {
        const result = await window.Swal.fire({
            icon: options.icon || 'warning',
            title: options.title || 'Confirmation',
            text,
            showCancelButton: true,
            confirmButtonText: options.confirmButtonText || 'Confirmer',
            cancelButtonText: options.cancelButtonText || 'Annuler',
            confirmButtonColor: isDanger ? '#c0392b' : '#2c3e50',
            cancelButtonColor: '#7f8c8d',
            reverseButtons: true,
            focusCancel: true
        });

        return result.isConfirmed;
    }

    return window.confirm(text);
}

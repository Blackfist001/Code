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

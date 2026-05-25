/**
 * Notifications globales top-right (hors alert boxes).
 */
class GlobalNotifier {
    constructor() {
        this.containerId = 'global-toast-container';
        this.defaultDuration = 5000;
    }

    _ensureContainer() {
        let container = document.getElementById(this.containerId);
        if (container) return container;

        container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'global-toast-container';
        document.body.appendChild(container);
        return container;
    }

    notify(message = '', type = 'info', durationMs = this.defaultDuration) {
        const text = String(message || '').trim();
        if (!text) return;

        const container = this._ensureContainer();
        const toast = document.createElement('div');
        toast.className = `global-toast global-toast-${type}`;

        const content = document.createElement('span');
        content.textContent = text;

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'global-toast-close';
        closeBtn.setAttribute('aria-label', 'Fermer la notification');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => toast.remove());

        toast.appendChild(content);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add('is-hiding');
            window.setTimeout(() => toast.remove(), 220);
        }, Math.max(1200, Number(durationMs) || this.defaultDuration));
    }
}

window.AppNotifier = window.AppNotifier || new GlobalNotifier();

export default window.AppNotifier;

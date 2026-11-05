/*
    VATOFINO Prensa & Eventos — scroll infinito + filtro por categoría.
    Paired with sections/custom-press-events.liquid. Loaded as type="module".

    Infinite scroll
    - Cards past the first batch are rendered with [data-deferred] (hidden by CSS),
      so they cost no layout and their lazy images don't download.
    - A sentinel after the grid is watched with IntersectionObserver; when the
      visitor gets near it, the next batch is revealed. Every card is already in
      the DOM, so there's no network request and nothing to paginate.

    Filter
    - Cards outside the active category get [hidden]; the matching ones restart
      from the first batch and the infinite scroll continues from there.
*/

if (!customElements.get('press-events')) {
    class PressEvents extends HTMLElement {
        connectedCallback() {
            this.list = this.querySelector('[data-list]');
            if (!this.list) return;

            this.items = [...this.list.querySelectorAll('[data-kind]')];
            this.buttons = [...this.querySelectorAll('[data-filter]')];
            this.sentinel = this.querySelector('[data-sentinel]');
            this.filterStatus = this.querySelector('[data-filter-status]');
            this.scrollStatus = this.querySelector('[data-scroll-status]');

            this.batch = Number(this.list.dataset.batch) || 0;
            this.pool = this.items;
            this.shown = this.batch ? this.batch : this.items.length;

            if (this.buttons.length) {
                this.onClick = (event) => {
                    const button = event.target.closest('[data-filter]');
                    if (button && this.contains(button)) this.applyFilter(button.dataset.filter);
                };
                this.addEventListener('click', this.onClick);
            }

            if (this.batch && this.sentinel) this.observe();
        }

        disconnectedCallback() {
            if (this.onClick) this.removeEventListener('click', this.onClick);
            if (this.observer) this.observer.disconnect();
        }

        get remaining() {
            return Math.max(this.pool.length - this.shown, 0);
        }

        observe() {
            if (!('IntersectionObserver' in window)) {
                this.shown = this.pool.length;
                this.render();
                return;
            }

            this.observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) this.loadMore();
                },
                { rootMargin: '0px 0px 600px 0px' }
            );
            this.observer.observe(this.sentinel);
        }

        loadMore() {
            if (!this.remaining) return;

            const from = this.shown;
            this.shown = Math.min(this.shown + this.batch, this.pool.length);
            this.render(from);

            if (this.scrollStatus) {
                this.scrollStatus.textContent = `Mostrando ${this.shown} de ${this.pool.length} publicaciones`;
            }

            // If the sentinel is still inside the margin after revealing (tall
            // screens, short cards), the observer won't fire again on its own —
            // re-observing forces a fresh check.
            if (this.remaining && this.observer) {
                this.observer.unobserve(this.sentinel);
                this.observer.observe(this.sentinel);
            }
        }

        /**
         * Sync attributes with state.
         * @param {number} revealedFrom First pool index revealed in this pass (for the fade-in).
         */
        render(revealedFrom = Infinity) {
            const visible = new Set(this.pool);

            this.items.forEach((item) => {
                item.hidden = !visible.has(item);
            });

            this.pool.forEach((item, index) => {
                const deferred = index >= this.shown;
                item.toggleAttribute('data-deferred', deferred);
                item.classList.toggle('is-revealed', !deferred && index >= revealedFrom);
            });

            if (this.sentinel) this.sentinel.hidden = !this.remaining;
        }

        applyFilter(filter) {
            this.pool = this.items.filter((item) => filter === 'all' || item.dataset.kind === filter);
            this.shown = this.batch ? Math.min(this.batch, this.pool.length) : this.pool.length;

            this.buttons.forEach((button) => {
                const active = button.dataset.filter === filter;
                button.setAttribute('aria-pressed', String(active));
                // Active = theme solid button, inactive = theme outline button.
                button.classList.toggle('theme-button--solid', active);
            });

            this.render();

            if (this.remaining && this.observer) {
                this.observer.unobserve(this.sentinel);
                this.observer.observe(this.sentinel);
            }

            if (this.filterStatus) {
                const count = this.pool.length;
                this.filterStatus.textContent = `${count} ${count === 1 ? 'publicación' : 'publicaciones'}`;
            }
        }
    }

    customElements.define('press-events', PressEvents);
}

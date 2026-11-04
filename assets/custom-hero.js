(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function initHero(hero) {
        if (hero.dataset.vfInit) return;
        hero.dataset.vfInit = 'true';

        const slides = [...hero.querySelectorAll('.vf-hero__slide')];
        if (slides.length < 2) return;

        const dots = [...hero.querySelectorAll('.vf-hero__dot')];
        const nextButton = hero.querySelector('.vf-hero__arrow--next');
        const prevButton = hero.querySelector('.vf-hero__arrow--prev');
        const toggle = hero.querySelector('.vf-hero__toggle');
        const speed = Number(hero.dataset.speed) || 7000;

        let current = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
        let timer = null;
        let userPaused = hero.dataset.autoplay !== 'true' || reducedMotion.matches;
        let hoverPaused = false;

        // Habilita los slides 2..n (y con ello la descarga de sus imágenes lazy)
        // solo cuando la página ya cargó, para no competir con el LCP.
        const enable = () => hero.classList.add('is-ready');
        const scheduleEnable = () => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(enable, { timeout: 2000 });
            } else {
                setTimeout(enable, 200);
            }
        };
        if (document.readyState === 'complete') scheduleEnable();
        else window.addEventListener('load', scheduleEnable, { once: true });

        function goTo(index) {
            if (index === current) return;
            enable();

            const prev = slides[current];
            prev.classList.remove('is-active');
            prev.setAttribute('aria-hidden', 'true');
            prev.inert = true;
            dots[current]?.classList.remove('is-active');
            dots[current]?.removeAttribute('aria-current');

            current = (index + slides.length) % slides.length;

            const next = slides[current];
            next.classList.add('is-active');
            next.removeAttribute('aria-hidden');
            next.inert = false;
            dots[current]?.classList.add('is-active');
            dots[current]?.setAttribute('aria-current', 'true');
        }

        function stop() {
            clearInterval(timer);
            timer = null;
        }

        function start() {
            stop();
            if (userPaused || hoverPaused || document.hidden) return;
            timer = setInterval(() => goTo(current + 1), speed);
        }

        function syncToggle() {
            hero.classList.toggle('is-paused', userPaused);
            if (!toggle) return;
            toggle.setAttribute(
                'aria-label',
                userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause
            );
        }

        // Controles: la región live solo anuncia cuando el usuario navega manualmente
        const slider = hero.querySelector('.vf-hero__slider');
        const manual = (fn) => () => {
            slider?.setAttribute('aria-live', 'polite');
            fn();
            start();
        };

        nextButton?.addEventListener('click', manual(() => goTo(current + 1)));
        prevButton?.addEventListener('click', manual(() => goTo(current - 1)));
        dots.forEach((dot, i) => dot.addEventListener('click', manual(() => goTo(i))));

        toggle?.addEventListener('click', () => {
            userPaused = !userPaused;
            syncToggle();
            start();
        });

        // Pausa al pasar el mouse / con foco de teclado (WCAG 2.2.2)
        hero.addEventListener('mouseenter', () => { hoverPaused = true; stop(); });
        hero.addEventListener('mouseleave', () => { hoverPaused = false; start(); });
        hero.addEventListener('focusin', () => { hoverPaused = true; stop(); });
        hero.addEventListener('focusout', (e) => {
            if (!hero.contains(e.relatedTarget)) { hoverPaused = false; start(); }
        });

        // Teclado: flechas izquierda/derecha
        hero.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') manual(() => goTo(current + 1))();
            if (e.key === 'ArrowLeft') manual(() => goTo(current - 1))();
        });

        // Swipe en móvil
        let touchX = null;
        hero.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
        hero.addEventListener('touchend', (e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(dx) > 50) manual(() => goTo(current + (dx < 0 ? 1 : -1)))();
        }, { passive: true });

        // No rotar mientras la pestaña está oculta
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

        // Editor de temas: seleccionar un bloque muestra su slide
        document.addEventListener('shopify:block:select', (e) => {
            const i = slides.indexOf(e.target);
            if (i > -1) { goTo(i); userPaused = true; syncToggle(); stop(); }
        });

        syncToggle();
        start();
    }

    const initAll = () => document.querySelectorAll('.vf-hero').forEach(initHero);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    document.addEventListener('shopify:section:load', initAll);
})();

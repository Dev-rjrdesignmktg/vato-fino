(function () {
  function initCascadeSection(root) {
    if (root.dataset.mcInitialized) return;
    root.dataset.mcInitialized = 'true';

    const titleEl = root.querySelector('[data-sticky-title]');
    const linkEl = root.querySelector('[data-sticky-link]');
    const allMarkers = Array.from(root.querySelectorAll('[data-collection-marker]'));

    if (!titleEl || allMarkers.length === 0) return;

    let activeMarker = null;
    let ticking = false;

    function setActive(marker) {
      if (!marker || marker === activeMarker) return;
      activeMarker = marker;

      const title = marker.getAttribute('data-title');
      const url = marker.getAttribute('data-url');

      if (title) titleEl.textContent = title;

      if (linkEl) {
        if (url) {
          linkEl.href = url;
          linkEl.hidden = false;
        } else {
          linkEl.hidden = true;
        }
      }
    }

    // Cascade renders a duplicate marker per collection (one for the desktop
    // grid, one for the mobile stack) and hides whichever doesn't match the
    // current breakpoint. Only the laid-out one should count.
    function getVisibleMarkers() {
      return allMarkers.filter((marker) => marker.offsetParent !== null);
    }

    // Picks the last marker whose top edge has scrolled past the middle of
    // the viewport, i.e. whichever collection is currently centered where
    // the sticky title sits. Recomputed from scratch on every scroll frame,
    // so it's correct regardless of scroll direction or speed.
    function updateActiveMarker() {
      ticking = false;

      const markers = getVisibleMarkers();
      if (markers.length === 0) return;

      const referenceY = window.innerHeight / 2;
      let current = markers[0];

      for (const marker of markers) {
        if (marker.getBoundingClientRect().top <= referenceY) {
          current = marker;
        } else {
          break;
        }
      }

      setActive(current);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveMarker);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  document.querySelectorAll('.vf-mc').forEach(initCascadeSection);
})();

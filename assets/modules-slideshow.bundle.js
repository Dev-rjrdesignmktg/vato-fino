import { S as Splide } from './shared-import-splide.esm.bundle.js';
window.Splide = Splide;
window.slideshows = {};
const _createSplideInstance = (splideRoot, options, extensions) => {
  window.slideshows[splideRoot.id] = new Splide(`#${splideRoot.id}`, options);
  if (splideRoot.matches('.splide--product')) {
    if (!splideRoot.hasAttribute('data-thumbnails')) {
      window.slideshows[splideRoot.id].mount(extensions);
    } else {
      const thumbsRoot = document.getElementById(splideRoot.getAttribute('data-thumbnails'));
      window.slideshows[thumbsRoot.id] = new Splide(`#${thumbsRoot.id}`, {
        direction: 'ttb',
        height: 'var(--thumbnails-height)',
        autoHeight: true,
        arrows: false,
        pagination: false,
        isNavigation: true,
        gap: '1.25rem',
        slideFocus: false,
        wheel: true,
        wheelSleep: 200
      });
      window.slideshows[splideRoot.id] = new Splide(`#${splideRoot.id}`, options);
      const mainSplide = window.slideshows[splideRoot.id];
      const thumbsSplide = window.slideshows[thumbsRoot.id];
      mainSplide.sync(thumbsSplide);
      mainSplide.mount(extensions);
      thumbsSplide.mount();
    }
  } else {
    window.slideshows[splideRoot.id].mount(extensions);
  }
};
window.destroySlideshow = splideRoot => {
  if (!window.slideshows[splideRoot.id]) return;
  window.slideshows[splideRoot.id].destroy(true);
  delete window.slideshows[splideRoot.id];
};
window.makeSlideshow = splideRoot => {
  // Thumbnails Splides’ initialization is started by their
  // main slideshow
  if (splideRoot.matches('.splide--thumbnails')) return;
  if (!splideRoot.id) {
    console.error('Cascade Theme: makeSlideshow requires a unique ID on the slideshow root');
    return;
  }
  if (window.slideshows[splideRoot.id]) return;
  const mobileOnly = splideRoot.matches('.splide--mobile-only'),
    desktopOnly = splideRoot.matches('.splide--desktop-only'),
    titlesOnTop = splideRoot.matches('.splide--titles-on-top');
  let breakpoints = {};
  if (mobileOnly) {
    breakpoints = {
      990: {
        destroy: true
      }
    };
  }
  if (!splideRoot.matches('.splide--product')) {
    if (!mobileOnly || desktopOnly) {
      if (!titlesOnTop) {
        breakpoints[990] = {
          perPage: 2,
          perMove: 2,
          speed: 610,
          // slightly less energetic than
          // var(--timing-func-energetic)
          easing: 'cubic-bezier(0.9,0.3,0.4,0.8)',
          padding: {
            right: 'var(--section-carousel-padding)'
          }
        };
      } else {
        breakpoints[990] = {
          perPage: 2,
          perMove: 2,
          speed: 840,
          // slightly less energetic than
          // var(--timing-func-energetic)
          easing: 'cubic-bezier(0.8,0.1,0.4,0.9)',
          padding: 'var(--section-carousel-padding)'
        };
      }
      if (desktopOnly) {
        breakpoints[0] = {
          destroy: true
        };
        breakpoints[990]['destroy'] = false;
      }
    }
  }
  if (splideRoot.matches('.splide--slideshow-section')) {
    breakpoints[990] = {
      speed: 840,
      // slightly less energetic than
      // var(--timing-func-energetic)
      easing: 'cubic-bezier(0.8,0.1,0.4,0.9)'
    };
  }
  const options = {
    mediaQuery: 'min',
    perPage: 1,
    perMove: 1,
    autoWidth: true,
    arrows: true,
    rewind: true,
    easing: 'var(--timing-func-energetic)',
    speed: 600,
    breakpoints: breakpoints
  };
  if (splideRoot.matches('.splide--product')) {
    let productSplideBreakpoints = {};
    if (splideRoot.hasAttribute('data-desktop-product-splide')) {
      if (splideRoot.dataset.desktopProductSplide === 'destroy') {
        productSplideBreakpoints = {
          768: {
            destroy: true
          }
        };
      } else if (splideRoot.dataset.desktopProductSplide === 'no-controls') {
        productSplideBreakpoints = {
          768: {
            arrows: false,
            pagination: false
          }
        };
      }
    } else {
      productSplideBreakpoints = {
        768: {
          arrows: true,
          pagination: false
        }
      };
    }
    if (splideRoot.hasAttribute('data-split-splide')) {
      productSplideBreakpoints = {
        768: {
          height: 'calc(100vh - var(--header-group-height, 0px))',
          arrows: true,
          pagination: false
        }
      };
    }
    const productOptions = {
      mediaQuery: 'min',
      perPage: 1,
      perMove: 1,
      autoWidth: true,
      arrows: true,
      rewind: true,
      easing: 'var(--timing-func-energetic)',
      speed: 600,
      drag: splideRoot.dataset.dragDisabled !== 'true',
      breakpoints: productSplideBreakpoints
    };
    import('./components-splide-product.bundle.js').then(({
      default: SplideProductModule,
      SplideProduct
    }) => {
      _createSplideInstance(splideRoot, productOptions, {
        SplideProduct
      });
    });
  } else {
    _createSplideInstance(splideRoot, options, {});
  }
};
window.discoverNewSlideshows = (container = document) => {
  container.querySelectorAll('.splide').forEach(splideRoot => {
    makeSlideshow(splideRoot, true);
  });
};
window.destroySlideshowsIn = (container = document) => {
  container.querySelectorAll('.splide').forEach(splideRoot => {
    destroySlideshow(splideRoot);
  });
};
window.refreshSlideshowsIn = (container = document) => {
  container.querySelectorAll('.splide').forEach(splideRoot => {
    refreshSlideshow(splideRoot);
  });
};
document.addEventListener('DOMContentLoaded', () => {
  discoverNewSlideshows();
});
document.addEventListener('dev:hotreloadmutation', () => {
  if (!Shopify.designMode) {
    destroySlideshowsIn();
    discoverNewSlideshows();
  }
});
document.addEventListener('cascade:product:mediachange', e => {
  const splideInstance = window.slideshows[e.detail.slideshow_id];
  if (!splideInstance) return;
  const slideIndex = splideInstance.Components.Elements.slides.findIndex(slide => Number(slide.dataset.mediaId) === e.detail.media_id);
  if (slideIndex > -1) {
    splideInstance.go(slideIndex);
  }
});

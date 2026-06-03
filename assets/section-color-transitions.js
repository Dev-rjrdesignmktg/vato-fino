function setSectionColorProperties(sectionColor) {
  document.documentElement.style.setProperty(
    '--color-scheme-text-override',
    `var(--color-scheme-${sectionColor}-text)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-background-override',
    `var(--color-scheme-${sectionColor}-background)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-accent-override',
    `var(--color-scheme-${sectionColor}-accent)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-accent-contrast-override',
    `var(--color-scheme-${sectionColor}-accent-contrast)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-secondary-override',
    `var(--color-scheme-${sectionColor}-secondary)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-solid-button-background-override',
    `var(--color-scheme-${sectionColor}-solid-button-background)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-solid-button-text-override',
    `var(--color-scheme-${sectionColor}-solid-button-text)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-solid-button-background-hover-override',
    `var(--color-scheme-${sectionColor}-solid-button-background-hover)`
  );

  document.documentElement.style.setProperty(
    '--color-scheme-solid-button-text-hover-override',
    `var(--color-scheme-${sectionColor}-solid-button-text-hover)`
  );

  document.documentElement.style.setProperty(
    '--icon-svg-select-override',
    `var(--color-scheme-${sectionColor}-icon-svg-select)`
  );

  document.documentElement.style.setProperty(
    '--icon-svg-arrow-right-override',
    `var(--color-scheme-${sectionColor}-icon-svg-arrow-right)`
  );
}

const sectionIOCallback = function (entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    } else {
      entry.target.classList.remove('in-view');
    }
  });

  const inViewSections = document.querySelectorAll(
    ':is(section, article)[data-color-scheme].in-view'
  );

  const inViewColorSchemes = [];

  inViewSections.forEach((section) => {
    inViewColorSchemes.push(section.dataset.colorScheme);
  });

  setSectionColorProperties(inViewColorSchemes[0]);
};

const sectionIOOptions = {
  root: null,
  rootMargin: '-19% 0px -19% 0px',
  threshold: 0.001,
};

const sectionIO = new IntersectionObserver(sectionIOCallback, sectionIOOptions);

const sectionSelector =
  ':is(section, article)[data-color-scheme]:not(.disable-section-color-transition-source)';

document.querySelectorAll(sectionSelector).forEach((section) => {
  sectionIO.observe(section);
});

if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (e) => {
    const section = e.target.querySelector(sectionSelector);

    if (section) {
      sectionIO.observe(section);
    }
  });

  document.addEventListener('shopify:section:unload', (e) => {
    const section = e.target.querySelector(sectionSelector);

    if (section) {
      sectionIO.unobserve(section);
    }
  });
}

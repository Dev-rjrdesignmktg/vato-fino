/**
 * Wrapper around Object.assign that deletes null or undefined
 * keys from the provided object, making them fall back to
 * values in the defaults object.
 *
 *
 * @param {Object} defaults - An object with defaults for settings/config
 * @param {Object} provided - Provided settings/config object
 * @returns {Object} - Merged object
 */

function objectWithDefaults(defaults, provided) {
  filterObjectByValues(provided, (value) => {
    return value === null || value === undefined;
  });

  return Object.assign(defaults, provided);
}

function wrap(el, tagName = 'div') {
  const wrapper = document.createElement(tagName);

  el.parentNode.insertBefore(wrapper, el);

  wrapper.appendChild(el);

  return wrapper;
}

function wrapAll(nodes, wrapper) {
  // Cache the current parent and previous sibling of the first node.
  var parent = nodes[0].parentNode;
  var previousSibling = nodes[0].previousSibling;

  // Place each node in wrapper.
  //  - If nodes is an array, we must increment the index we grab from
  //    after each loop.
  //  - If nodes is a NodeList, each node is automatically removed from
  //    the NodeList when it is removed from its parent with appendChild.
  for (var i = 0; nodes.length - i; wrapper.firstChild === nodes[0] && i++) {
    wrapper.appendChild(nodes[i]);
  }

  // Place the wrapper just after the cached previousSibling
  parent.insertBefore(wrapper, previousSibling.nextSibling);

  return wrapper;
}

function unwrap(wrapper) {
  // place childNodes in document fragment
  var docFrag = document.createDocumentFragment();
  while (wrapper.firstChild) {
    var child = wrapper.removeChild(wrapper.firstChild);
    docFrag.appendChild(child);
  }

  // replace wrapper with document fragment
  wrapper.parentNode.replaceChild(docFrag, wrapper);
}

function loadThisScript(scriptSrc) {
  const scriptEl = document.createElement('script');
  scriptEl.src = scriptSrc;
  scriptEl.type = 'module';

  return new Promise((resolve, reject) => {
    if (
      document.head.querySelector(`script[src="${scriptSrc}"]`) ||
      document.body.querySelector(`script[src="${scriptSrc}"]`)
    )
      resolve();

    document.body.appendChild(scriptEl);

    scriptEl.onload = () => {
      resolve();
    };

    scriptEl.onerror = () => {
      reject();
    };
  });
}

function loadTheseScripts(scriptSrcArray) {
  const promises = [];

  for (scriptSrc of scriptSrcArray) {
    promises.push(loadThisScript(scriptSrc));
  }

  return Promise.all(promises);
}

let touchDevice = false;

function setTouch() {
  touchDevice = true;
}

function isTouch() {
  return touchDevice;
}

function scrollToTopOf(element) {
  if (!element) return;

  const topOffset = element.getBoundingClientRect().top + window.scrollY;

  const prefersReducedMotionMQL = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  window.scroll({
    top: topOffset,
    ...(!prefersReducedMotionMQL.matches && { behavior: 'smooth' }),
  });
}

function objectHasNoKeys(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }

  return true;
}

function getSizedImageUrl(src, size) {
  const url = new URL(src);

  url.searchParams.set('width', size);

  return url;
}

function getImageSrcset(
  src,
  sizes = [
    180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 1944, 2160, 2376, 2592,
    2808, 3024,
  ]
) {
  if (!src) return;

  const srcset = [];

  sizes.forEach((size) => {
    srcset.push(`${getSizedImageUrl(src, size.toString())} ${size}w`);
  });

  return srcset.join(',\n');
}

function fetchConfigDefaults(type = 'json') {
  return {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json;',
      Accept: `application/${type}`,
    },
  };
}

function parseDOMFromString(htmlString) {
  window.___cascadeDOMParser = window.___cascadeDOMParser || new DOMParser();

  return window.___cascadeDOMParser.parseFromString(htmlString, 'text/html');
}

function querySelectorInHTMLString(selector, htmlString) {
  return parseDOMFromString(htmlString).querySelector(selector);
}

/**
 * Light wrapper around fetch for making common
 * requests easier. Provides very basic caching.
 */

window.__fetchCache = window.__fetchCache || {};

const RESPONSE_TYPE_JSON = 0;
const RESPONSE_TYPE_TEXT = 1;

async function fetchAndCache(
  url,
  options,
  cacheTimeout = 5000,
  forceFresh = false,
  responseType
) {
  if (__fetchCache[url] && !forceFresh) {
    return __fetchCache[url];
  }

  const responseReader =
    responseType === RESPONSE_TYPE_TEXT
      ? Response.prototype.text
      : Response.prototype.json;

  const res = await fetch(url, options);
  const data = responseReader.call(res);

  if (cacheTimeout && cacheTimeout > 0) {
    __fetchCache[url] = data;

    setTimeout(() => {
      delete __fetchCache[url];
    }, cacheTimeout);
  }

  return data;
}

/**
 * fetchHTML and fetchJSON cache responses for 5 seconds
 * by default; if a fresh request is required, set
 * forceFresh to true or use the freshHTML and freshJSON
 * helper functions.
 */

async function fetchHTML(
  url,
  options,
  cacheTimeout = 5000,
  forceFresh = false
) {
  return fetchAndCache(
    url,
    options,
    cacheTimeout,
    forceFresh,
    RESPONSE_TYPE_TEXT
  );
}

function freshHTML(url, options) {
  return fetchHTML(url, options, 0, true);
}

async function fetchJSON(
  url,
  options,
  cacheTimeout = 5000,
  forceFresh = false
) {
  return fetchAndCache(
    url,
    options,
    cacheTimeout,
    forceFresh,
    RESPONSE_TYPE_JSON
  );
}

function freshJSON(url, options) {
  return fetchJSON(url, options, 0, true);
}

async function fetchHTMLFragment(url, selector) {
  const fetchedHTMLString = await fetchHTML(url);
  const fragment = querySelectorInHTMLString(selector, fetchedHTMLString);

  return fragment ? fragment.innerHTML : '';
}

function initTeleport(el) {
  if (!el) return;

  const teleportCandidates = el.querySelectorAll('[data-should-teleport]');

  if (teleportCandidates.length) {
    teleportCandidates.forEach((teleportCandidate) => {
      teleportCandidate.setAttribute(
        'x-teleport',
        teleportCandidate.dataset.shouldTeleport
      );
    });
  }
}

function getModalLabel(modalSlotName, slotEl) {
  if (Alpine.store('modals')[modalSlotName].open) {
    const labelSourceEl = Array.from(slotEl.children).filter((el) =>
      el.hasAttribute('data-modal-label')
    )[0];

    if (labelSourceEl) {
      return labelSourceEl.dataset.modalLabel;
    }
  }

  return false;
}

function waitForContent(element) {
  return new Promise((resolve, reject) => {
    if (element.innerHTML.trim().length > 0) {
      resolve();
    }

    const mutationObserver = new MutationObserver((mutationsList, observer) => {
      if (element.innerHTML.trim().length > 0) {
        observer.disconnect();
        resolve();
      }
    });

    mutationObserver.observe(element, { childList: true });
  });
}

function swapAttributes(el, fromAttr, toAttr) {
  el.setAttribute(toAttr, el.getAttribute(fromAttr));
  el.removeAttribute(fromAttr);
}

function iFrameCommand(iFrameEl, commandString) {
  if (!iFrameEl || !commandString) return;

  iFrameEl.contentWindow.postMessage(
    JSON.stringify({
      event: 'command',
      func: commandString,
      args: '',
    }),
    '*'
  );
}

function iFrameMethod(iFrameEl, methodString) {
  if (!iFrameEl || !methodString) return;

  iFrameEl.contentWindow.postMessage(
    JSON.stringify({
      method: methodString,
    }),
    '*'
  );
}

function splideIsNotDestroyed(splideRootEl) {
  if (!splideRootEl) return;

  if (window.Splide && splideRootEl) {
    if (
      window.slideshows &&
      window.slideshows[`${splideRootEl.id}`] &&
      !window.slideshows[`${splideRootEl.id}`].state.is(
        window.Splide.STATES.DESTROYED
      )
    ) {
      return true;
    }
  }

  return false;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function kebabCase(subject) {
  if ([' ', '_'].includes(subject)) return subject;
  return subject
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]/, '-')
    .toLowerCase();
}

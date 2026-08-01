import { on, supportsViewTransitions, prefersReducedMotion } from '../utils/dom.js';

/**
 * Cross-page transition using the View Transition API.
 *
 * Progressive enhancement:
 *   - Browsers without startViewTransition navigate normally (no interception).
 *   - Reduced-motion users get the same fast native navigation.
 *   - We only intercept same-origin, plain left-clicks on internal .html links.
 *   - Modified clicks (Ctrl/Cmd/Shift/Alt/middle) fall through to the browser.
 *
 * The visual fade is defined via @view-transition in animations.css.
 */
export function initPageTransitions() {
  if (!supportsViewTransitions() || prefersReducedMotion()) return;

  on(document, 'click', (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (/^(mailto:|tel:)/i.test(href)) return;

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;

    // Only same-directory .html links (or index at "/")
    if (!/\.html($|\?|#)/i.test(url.pathname) && url.pathname !== '/') return;

    event.preventDefault();
    document.startViewTransition(() => {
      window.location.href = url.href;
    });
  });
}

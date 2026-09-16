/**
 * Entry point — loaded as an ES module from every page (<script type="module">).
 * Registers the .js enhancement class synchronously so initial animation
 * states apply in CSS without a flash of unstyled content, then wires up the components.
 */

// Set the enhancement class immediately (before DOM ready) so that
// [data-animate] initial states apply in CSS without a flash of unstyled content.
document.documentElement.classList.add('js');

import { initNavigation } from './components/navigation.js';
import { initForms } from './components/form.js';
import { initSignaturePads } from './components/signature-pad.js';
import { initGalleryFilter } from './components/gallery.js';
import { initAccordion } from './components/accordion.js';
import { initCarousel } from './components/carousel.js';
import { initAnimations } from './animations/index.js';
import { initPageTransitions } from './animations/page-transitions.js';
import { initModal } from './components/modal.js';
import { initConsent } from './components/consent.js';

function boot() {
  if (boot.ran) return;
  boot.ran = true;

  initNavigation();
  initForms();
  initSignaturePads();
  initGalleryFilter();
  initAccordion();
  initCarousel();
  initAnimations();
  initPageTransitions();
  initModal();
  initConsent();
}

if (document.readyState !== 'loading') {
  boot();
} else {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
}

// Safety net: module imports can delay execution past DOMContentLoaded,
// leaving the listener attached after the event already fired. This catches
// that edge case without duplicating work.
setTimeout(() => {
  if (!boot.ran) boot();
}, 0);
